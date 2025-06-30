import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import axios from 'axios';
import './App.css';

SyntaxHighlighter.registerLanguage('python', python);

const API_BASE = 'http://localhost:5000';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon sx={{ fontSize: 48 }} />
          Cerebras Multi-Agent System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Orchestrate multiple AI agents powered by Cerebras models
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<SettingsIcon />} label="Configuration" />
          <Tab icon={<CodeIcon />} label="Agents" />
          <Tab icon={<PlayArrowIcon />} label="Execute" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Cerebras API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveApiKey}
                    sx={{ minWidth: 120 }}
                  >
                    Save
                  </Button>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="Model"
                  >
                    {models.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box>
                          <Typography variant="body1">{model.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {model.params} • {model.speed}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Agents</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddAgent}
              >
                Add Agent
              </Button>
            </Box>
            <List>
              {agents.map((agent, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={agent.name}
                      secondary={
                        <>
                          <Chip
                            label={agent.type}
                            size="small"
                            color={agent.type === 'CodeAgent' ? 'primary' : 'secondary'}
                            sx={{ mr: 1 }}
                          />
                          {agent.description}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleEditAgent(index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteAgent(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < agents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prompt
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
                    onClick={handleRun}
                    disabled={isRunning}
                    size="large"
                  >
                    {isRunning ? 'Running...' : 'Execute'}
                  </Button>
                  {isRunning && <CircularProgress size={24} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {(output || error) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Status
                  </Typography>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  {output && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: '#1e1e1e',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <SyntaxHighlighter
                        language="text"
                        style={atomOneDark}
                        customStyle={{
                          margin: 0,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {output}
                      </SyntaxHighlighter>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {executionLogs && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🤖 Agent Execution Logs
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: '#1e1e1e',
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    <SyntaxHighlighter
                      language="text"
                      style={atomOneDark}
                      customStyle={{
                        margin: 0,
                        backgroundColor: 'transparent',
                        fontSize: '12px',
                      }}
                    >
                      {executionLogs}
                    </SyntaxHighlighter>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          )}

          {finalResult && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✨ Final Result
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #4caf50',
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        margin: 0,
                      }}
                    >
                      {finalResult}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Agent Dialog */}
      <Dialog
        open={agentDialog.open}
        onClose={() => setAgentDialog({ open: false, agent: null, index: -1 })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {agentDialog.index === -1 ? 'Add Agent' : 'Edit Agent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={agentDialog.agent?.name || ''}
              onChange={(e) =>
                setAgentDialog({
                  ...agentDialog,
                  agent: { ...agentDialog.agent, name: e.target.value },
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={agentDialog.agent?.type || 'ToolCallingAgent'}
                onChange={(e) =>
                  setAgentDialog({
                    ...agentDialog,
                    agent: { ...agentDialog.agent, type: e.target.value },
                  })
                }
                label="Type"
              >
                <MenuItem value="ToolCallingAgent">Tool Calling Agent</MenuItem>
                <MenuItem value="CodeAgent">Code Agent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={agentDialog.agent?.description || ''}
              onChange={(e) =>
                setAgentDialog({
                  ...agentDialog,
                  agent: { ...agentDialog.agent, description: e.target.value },
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDialog({ open: false, agent: null, index: -1 })}>
            Cancel
          </Button>
          <Button onClick={handleSaveAgent} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}

export default App;
