from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import os
import sys
import io
import json
import traceback
from contextlib import redirect_stdout, redirect_stderr
import threading
import queue
import time

# Import the required modules for the multi-agent system
import requests
from markdownify import markdownify
from requests.exceptions import RequestException
from smolagents import (
    tool,
    WebSearchTool,
    ToolCallingAgent,
    CodeAgent,
    LiteLLMModel,
)
import re

app = Flask(__name__)
CORS(app)

# Store agent configurations
agent_configs = {}

# Custom tool: visit_webpage
@tool
def visit_webpage(url: str) -> str:
    """
    Fetch the content of a webpage and return it as clean markdown (first 4 kB).
    
    Args:
        url: The URL of the webpage to fetch and convert to markdown
    
    Returns:
        str: The webpage content converted to markdown format, truncated to 4000 characters
    """
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        md = markdownify(resp.text)
        md = re.sub(r"\n{3,}", "\n\n", md).strip()
        return md[:4000]
    except RequestException as e:
        return f"Error fetching {url}: {e}"


class StreamCapture:
    """Capture stdout/stderr and queue the output for streaming"""
    def __init__(self, output_queue):
        self.output_queue = output_queue
        self.buffer = []
        
    def write(self, text):
        self.buffer.append(text)
        self.output_queue.put(('output', text))
        
    def flush(self):
        pass


@app.route('/', methods=['GET', 'HEAD'])
def health_check():
    """Health check endpoint for Render"""
    return jsonify({'status': 'healthy', 'service': 'cerebras-multiagent-backend'})


@app.route('/api/models', methods=['GET'])
def get_models():
    """Return available Cerebras models"""
    models = [
        {
            "id": "cerebras/llama-4-scout-17b-16e-instruct",
            "name": "Llama 4 Scout",
            "params": "109 billion",
            "speed": "~2600 tokens/s"
        },
        {
            "id": "cerebras/llama3.1-8b",
            "name": "Llama 3.1 8B",
            "params": "8 billion",
            "speed": "~2200 tokens/s"
        },
        {
            "id": "cerebras/llama-3.3-70b",
            "name": "Llama 3.3 70B",
            "params": "70 billion",
            "speed": "~2100 tokens/s"
        },
        {
            "id": "cerebras/qwen-3-32b",
            "name": "Qwen 3 32B",
            "params": "32 billion",
            "speed": "~2100 tokens/s"
        },
        {
            "id": "cerebras/deepseek-r1-distill-llama-70b",
            "name": "DeepSeek R1 Distill Llama 70B",
            "params": "70 billion",
            "speed": "~1700 tokens/s"
        }
    ]
    return jsonify(models)


@app.route('/api/run', methods=['POST'])
def run_agents():
    """Run the multi-agent system"""
    data = request.json
    api_key = data.get('apiKey')
    model_id = data.get('modelId')
    prompt = data.get('prompt')
    agents = data.get('agents', [])
    
    if not api_key or not model_id or not prompt:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Set the API key
        os.environ['CEREBRAS_API_KEY'] = api_key
        
        # Initialize the model
        model = LiteLLMModel(
            model_id=model_id,
            api_key=api_key,
        )
        
        # Create agents based on configuration
        created_agents = {}
        
        for agent_config in agents:
            agent_type = agent_config.get('type', 'ToolCallingAgent')
            agent_name = agent_config.get('name')
            agent_description = agent_config.get('description')
            
            if agent_type == 'ToolCallingAgent':
                # Web agent with tools
                tools = []
                if 'web' in agent_name.lower():
                    tools = [WebSearchTool(), visit_webpage]
                
                agent = ToolCallingAgent(
                    tools=tools,
                    model=model,
                    max_steps=10,
                    name=agent_name,
                    description=agent_description,
                )
            elif agent_type == 'CodeAgent':
                # Code agent
                agent = CodeAgent(
                    tools=[],
                    model=model,
                    name=agent_name,
                    description=agent_description,
                )
            
            created_agents[agent_name] = agent
        
        # Create manager agent with managed agents
        managed_agents = list(created_agents.values())
        manager_agent = CodeAgent(
            tools=[],
            model=model,
            managed_agents=managed_agents,
            additional_authorized_imports=["math", "datetime", "pandas", "numpy"],
            max_steps=12,
            name="manager_agent",
            description="Plans tasks, asks other agents for help, and assembles the final answer.",
        )
        
        # Capture both stdout and execution details
        execution_log = []
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        # Custom stream to capture detailed output
        class LogCapture:
            def __init__(self):
                self.content = []
                
            def write(self, text):
                self.content.append(text)
                execution_log.append(text)
                original_stdout.write(text)  # Still show in terminal
                
            def flush(self):
                pass
        
        log_capture = LogCapture()
        
        try:
            # Redirect stdout to capture execution details
            sys.stdout = log_capture
            sys.stderr = log_capture
            
            print(f"🚀 Starting execution with prompt: {prompt}\n")
            answer = manager_agent.run(prompt)
            print(f"\n✅ Execution completed successfully!")
            
        finally:
            # Restore original streams
            sys.stdout = original_stdout
            sys.stderr = original_stderr
        
        # Join all execution logs
        execution_details = ''.join(execution_log)
        
        return jsonify({
            'status': 'completed',
            'result': answer,
            'execution_logs': execution_details,
            'message': 'Agent execution completed successfully'
        }), 200
        
    except Exception as e:
        error_msg = f"Error: {str(e)}\n{traceback.format_exc()}"
        print(f"Error in agent execution: {error_msg}")
        return jsonify({
            'status': 'error',
            'error': error_msg
        }), 500


@app.route('/api/default-config', methods=['GET'])
def get_default_config():
    """Return the default agent configuration from demo.py"""
    default_agents = [
        {
            "name": "web_agent",
            "type": "ToolCallingAgent",
            "description": "Searches the internet and reads web pages to gather fresh data."
        },
        {
            "name": "calc_agent",
            "type": "CodeAgent",
            "description": "Runs Python to perform calculations or data wrangling."
        }
    ]
    
    default_prompt = (
        "Plan a perfect geeky weekend in San Francisco for a visiting AI enthusiast. "
        "Find one cool tech meetup on Saturday evening, an unusual bookstore to visit on Sunday morning, "
        "and a scenic cafe with good Wi-Fi for Sunday afternoon hacking. Provide the walking distance between "
        "each stop, both in kilometres and in 'Wafer-Scale Engine diagonals' (21.5 cm per WSE). End with a rhyming slogan!"
    )
    
    return jsonify({
        'agents': default_agents,
        'prompt': default_prompt
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
