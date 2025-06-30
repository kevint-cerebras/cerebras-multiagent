"""
cerebras_smol_demo.py
Demo of a multi‑agent system using smolagents powered entirely by Cerebras models.

Agents
======
manager_agent – top‑level planner that delegates.
web_agent      – browses the web (search + page reader).
calc_agent     – crunches numbers in Python.

The demo plans a geek‑themed weekend in San Francisco: it grabs live ideas from the web,
then computes walking distances in both kilometres and "GPU die diagonals" (assuming a
Cerebras WSE wafer is 21.5 cm across) – and signs off with a catchy slogan.

Quick start
-----------
# 1. Have Python ≥3.9
# 2. Install deps
pip install smolagents[toolkit] markdownify litellm cerebras-cloud-sdk requests
# 3. Export your Cerebras key
export CEREBRAS_API_KEY="sk‑..."
# 4. Run
python cerebras_smol_demo.py
"""

import os
import re
from typing import List, Dict

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

# -----------------------------------------------------------------------------
# Custom tool: visit_webpage – fetch a page and turn it into markdown
# -----------------------------------------------------------------------------
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
        return md[:4000]  # keep the context small for the LLM
    except RequestException as e:
        return f"Error fetching {url}: {e}"


# -----------------------------------------------------------------------------
# LLM driver – LiteLLM targeting Cerebras Inference API
# -----------------------------------------------------------------------------
model = LiteLLMModel(
    model_id="cerebras/llama-4-scout-17b-16e-instruct",  # any Cerebras model works
    api_key=os.getenv("CEREBRAS_API_KEY"),
)

# -----------------------------------------------------------------------------
# Helper agents
# -----------------------------------------------------------------------------
web_agent = ToolCallingAgent(
    tools=[WebSearchTool(), visit_webpage],
    model=model,
    max_steps=10,
    name="web_agent",
    description="Searches the internet and reads web pages to gather fresh data.",
)

calc_agent = CodeAgent(
    tools=[],
    model=model,
    name="calc_agent",
    description="Runs Python to perform calculations or data wrangling.",
)

# -----------------------------------------------------------------------------
# Manager agent orchestrates everything
# -----------------------------------------------------------------------------
manager_agent = CodeAgent(
    tools=[],
    model=model,
    managed_agents=[web_agent, calc_agent],
    additional_authorized_imports=["math", "datetime", "pandas", "numpy"],
    max_steps=12,
    name="manager_agent",
    description="Plans tasks, asks other agents for help, and assembles the final answer.",
)


# -----------------------------------------------------------------------------
# Demo run
# -----------------------------------------------------------------------------
def main(question: str):
    print("Prompt:\n", question)
    answer = manager_agent.run(question)
    print("\n=== ANSWER ===\n")
    print(answer)


if __name__ == "__main__":
    demo_prompt = (
        "Plan a perfect geeky weekend in San Francisco for a visiting AI enthusiast. "
        "Find one cool tech meetup on Saturday evening, an unusual bookstore to visit on Sunday morning, "
        "and a scenic cafe with good Wi‑Fi for Sunday afternoon hacking. Provide the walking distance between "
        "each stop, both in kilometres and in 'Wafer‑Scale Engine diagonals' (21.5 cm per WSE). End with a rhyming slogan!"
    )
    main(demo_prompt)
