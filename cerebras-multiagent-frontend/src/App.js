import React, { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import axios from 'axios';
import './App.css';

SyntaxHighlighter.registerLanguage('python', python);

const API_BASE = 'https://cerebras-multiagent-1.onrender.com';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} className={value === index ? 'animate-fadeIn' : ''}>
      {value === index && <div className="py-6">{children}</div>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [apiKey, setApiKey] = useState(localStorage.getItem('cerebras_api_key') || '');
  const [selectedModel, setSelectedModel] = useState('cerebras/llama-4-scout-17b-16e-instruct');
  const [models, setModels] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [agents, setAgents] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionLogs, setExecutionLogs] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const [error, setError] = useState('');
  const [agentDialog, setAgentDialog] = useState({ open: false, agent: null, index: -1 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchModels();
    loadDefaultConfig();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/models`);
      setModels(response.data);
    } catch (err) {
      setError('Failed to fetch models');
    }
  };

  const loadDefaultConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/default-config`);
      setAgents(response.data.agents);
      setPrompt(response.data.prompt);
    } catch (err) {
      setError('Failed to load default configuration');
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('cerebras_api_key', apiKey);
    setSnackbar({ open: true, message: 'API Key saved!', severity: 'success' });
  };

  const handleAddAgent = () => {
    setAgentDialog({
      open: true,
      agent: { name: '', type: 'ToolCallingAgent', description: '' },
      index: -1,
    });
  };

  const handleEditAgent = (index) => {
    setAgentDialog({
      open: true,
      agent: { ...agents[index] },
      index,
    });
  };

  const handleDeleteAgent = (index) => {
    const newAgents = agents.filter((_, i) => i !== index);
    setAgents(newAgents);
  };

  const handleSaveAgent = () => {
    const { agent, index } = agentDialog;
    if (index === -1) {
      setAgents([...agents, agent]);
    } else {
      const newAgents = [...agents];
      newAgents[index] = agent;
      setAgents(newAgents);
    }
    setAgentDialog({ open: false, agent: null, index: -1 });
  };

  const handleRun = async () => {
    if (!apiKey) {
      setError('Please set your Cerebras API key');
      return;
    }
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    if (agents.length === 0) {
      setError('Please add at least one agent');
      return;
    }
    setIsRunning(true);
    setOutput('');
    setExecutionLogs('');
    setFinalResult('');
    setError('');
    try {
      setOutput('🚀 Starting multi-agent execution...\n');
      const response = await axios.post(`${API_BASE}/api/run`, {
        apiKey,
        modelId: selectedModel,
        prompt,
        agents,
      });
      if (response.data.status === 'completed') {
        setExecutionLogs(response.data.execution_logs || 'No execution logs available');
        setFinalResult(response.data.result || 'No result available');
        setOutput('✅ Execution completed successfully!');
        setIsRunning(false);
        setSnackbar({ open: true, message: 'Agent execution completed!', severity: 'success' });
      } else if (response.data.status === 'error') {
        setError(response.data.error || 'Unknown error occurred');
        setIsRunning(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to run agents';
      setError(errorMessage);
      setOutput(prev => prev + `\n❌ Error: ${errorMessage}`);
      setIsRunning(false);
      setSnackbar({ open: true, message: 'Agent execution failed!', severity: 'error' });
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-3 mb-2">
            <span className="inline-block bg-gradient-to-tr from-teal-400 to-cyan-400 p-3 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-900"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-tr from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">Multi-Agent Search</h1>
          <p className="text-lg text-slate-400">Run multiple AI Agents with Cerebras models</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <nav className="bg-slate-800 rounded-xl flex overflow-hidden shadow-lg">
            {["Configuration", "Agents", "Execute"].map((label, idx) => (
              <button
                key={label}
                className={`px-6 py-3 font-medium transition-colors duration-200 focus:outline-none ${tabValue === idx ? 'bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-900' : 'text-slate-300 hover:bg-slate-700'}`}
                onClick={() => setTabValue(idx)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <div className="bg-slate-800/80 rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">API Configuration</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                className="flex-1 px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                type="password"
                placeholder="Cerebras API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button
                className="px-6 py-3 rounded-lg bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-900 font-semibold shadow hover:scale-105 transition"
                onClick={handleSaveApiKey}
              >
                Save
              </button>
            </div>
            <div>
              <label className="block mb-2 text-slate-300 font-medium">Model</label>
              <select
                className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.params} • {model.speed})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className="bg-slate-800/80 rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Agents</h2>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-900 font-semibold shadow hover:scale-105 transition"
                onClick={handleAddAgent}
              >
                <span className="text-xl">+</span> Add Agent
              </button>
            </div>
            <ul className="divide-y divide-slate-700">
              {agents.map((agent, index) => (
                <li key={index} className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-semibold text-lg">{agent.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${agent.type === 'CodeAgent' ? 'bg-cyan-700 text-cyan-200' : 'bg-teal-700 text-teal-200'}`}>{agent.type}</span>
                      <span className="text-slate-400 text-sm">{agent.description}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded hover:bg-slate-700" onClick={() => handleEditAgent(index)}>
                      <span role="img" aria-label="edit">✏️</span>
                    </button>
                    <button className="p-2 rounded hover:bg-slate-700" onClick={() => handleDeleteAgent(index)}>
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <div className="bg-slate-800/80 rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">Prompt</h2>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none mb-4"
              rows={6}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
            />
            <div className="flex gap-4 items-center">
              <button
                className="px-8 py-3 rounded-lg bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-900 font-semibold shadow hover:scale-105 transition flex items-center gap-2 text-lg"
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? <span className="animate-spin">⏳</span> : <span>▶️</span>}
                {isRunning ? 'Running...' : 'Execute'}
              </button>
              {isRunning && <span className="ml-2 text-teal-400 animate-pulse">Running...</span>}
            </div>
          </div>
          {(output || error) && (
            <div className="bg-slate-900/80 rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-2">Status</h3>
              {error && (
                <div className="bg-red-800/40 text-red-200 rounded p-3 mb-2 font-semibold">{error}</div>
              )}
              {output && (
                <div className="output-terminal overflow-auto max-h-48 mt-2">
                  <SyntaxHighlighter
                    language="text"
                    style={atomOneDark}
                    customStyle={{ margin: 0, backgroundColor: 'transparent' }}
                  >
                    {output}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          )}
          {executionLogs && (
            <div className="bg-slate-900/80 rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-2">🤖 Agent Execution Logs</h3>
              <div className="output-terminal overflow-auto max-h-96">
                <SyntaxHighlighter
                  language="text"
                  style={atomOneDark}
                  customStyle={{ margin: 0, backgroundColor: 'transparent', fontSize: '12px' }}
                >
                  {executionLogs}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
          {finalResult && (
            <div className="bg-gradient-to-tr from-teal-900/80 to-cyan-900/80 rounded-2xl shadow-xl p-6 mb-6 border-2 border-teal-400">
              <h3 className="text-xl font-bold mb-2">✨ Final Result</h3>
              <pre className="whitespace-pre-wrap font-mono text-base text-teal-200">{finalResult}</pre>
            </div>
          )}
        </TabPanel>

        {/* Agent Dialog */}
        {agentDialog.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-4">{agentDialog.index === -1 ? 'Add Agent' : 'Edit Agent'}</h2>
              <div className="flex flex-col gap-4">
                <input
                  className="px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                  type="text"
                  placeholder="Name"
                  value={agentDialog.agent?.name || ''}
                  onChange={e => setAgentDialog({ ...agentDialog, agent: { ...agentDialog.agent, name: e.target.value } })}
                />
                <select
                  className="px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                  value={agentDialog.agent?.type || 'ToolCallingAgent'}
                  onChange={e => setAgentDialog({ ...agentDialog, agent: { ...agentDialog.agent, type: e.target.value } })}
                >
                  <option value="ToolCallingAgent">Tool Calling Agent</option>
                  <option value="CodeAgent">Code Agent</option>
                </select>
                <textarea
                  className="px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                  rows={3}
                  placeholder="Description"
                  value={agentDialog.agent?.description || ''}
                  onChange={e => setAgentDialog({ ...agentDialog, agent: { ...agentDialog.agent, description: e.target.value } })}
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-5 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                  onClick={() => setAgentDialog({ open: false, agent: null, index: -1 })}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 rounded-lg bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-900 font-semibold shadow hover:scale-105 transition"
                  onClick={handleSaveAgent}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snackbar.open && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-100 px-6 py-3 rounded-lg shadow-lg border border-teal-400 animate-fadeIn z-50">
            {snackbar.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
