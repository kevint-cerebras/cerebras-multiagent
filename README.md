# Cerebras Multi-Agent System

A powerful multi-agent AI system powered by Cerebras' ultra-fast models. Features web research, code execution, and intelligent task orchestration through a modern web interface.

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (required for smolagents)
- **Node.js 16+**
- **Cerebras API Key** → [Get one here](https://cloud.cerebras.ai?utm_source=multiagent)

### 1. Clone & Setup
```bash
git clone https://github.com/kevint-cerebras/cerebras-multiagent
cd cerebras-multiagent
```

### 2. Start Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Set your API key
export CEREBRAS_API_KEY="your-api-key-here"

# Start backend server
python app.py
```
**Backend runs on:** `http://localhost:5000`

### 3. Start Frontend (New Terminal)
```bash
# Navigate to frontend
cd cerebras-multiagent-frontend

# Install dependencies
npm install

# Start frontend
npm start
```
**Frontend runs on:** `http://localhost:3000`

### 4. Use the Web Interface
1. Open `http://localhost:3000` in your browser
2. Enter your Cerebras API key in the Configuration tab
3. Configure agents in the Agents tab
4. Execute tasks in the Execute tab

---

## 🎯 What This Does

**Multi-Agent System** that can:
- 🔍 **Web Research**: Search internet and extract webpage content
- 💻 **Code Execution**: Run Python calculations and data processing
- 🧠 **Task Orchestration**: Intelligently delegate and coordinate tasks
- ⚡ **Ultra-Fast**: Powered by Cerebras models (2000+ tokens/sec)

**Example**: Find coffee shops in Seattle → agents research locations, extract reviews, and calculate walking distances.

---

## 🛠️ Alternative Ways to Run

### Demo Script Only
```bash
# Install dependencies
pip install -r requirements.txt

# Set API key
export CEREBRAS_API_KEY="your-api-key-here"

# Run demo
python demo.py
```

### Backend Only (API)
```bash
cd backend
pip install -r requirements.txt
export CEREBRAS_API_KEY="your-api-key-here"
python app.py
```
Use the API at `http://localhost:5000/api/`

### Frontend Only (Development)
```bash
cd cerebras-multiagent-frontend
npm install
npm start
```
Configure the backend URL in the frontend code if needed.

---

## 🤖 Available Models

Choose from these Cerebras models:
- **Llama 4 Scout 17B**: ~2600 tokens/s
- **Llama 3.1 8B**: ~2200 tokens/s  
- **Llama 3.3 70B**: ~2100 tokens/s
- **Qwen 3 32B**: ~2100 tokens/s
- **DeepSeek R1 Distill 70B**: ~1700 tokens/s

---

## 🏗️ Project Structure

```
cerebras-multiagent/
├── backend/                    # Flask API
│   ├── app.py                 # Main server
│   └── requirements.txt       # Backend deps
├── cerebras-multiagent-frontend/  # React UI
│   ├── src/App.js            # Main component
│   └── package.json          # Frontend deps
├── demo.py                   # Standalone demo
└── requirements.txt          # Demo deps
```

---

## 🔧 Configuration

### Environment Variables
```bash
export CEREBRAS_API_KEY="your-api-key-here"
```

### Agent Types
- **ToolCallingAgent**: Web search, webpage reading
- **CodeAgent**: Python execution, calculations
- **Manager Agent**: Task coordination and planning

---

## 📡 API Usage

### POST `/api/run`
```json
{
  "apiKey": "your-api-key",
  "modelId": "cerebras/llama-4-scout-17b-16e-instruct", 
  "prompt": "Find 3 highly-rated coffee shops in downtown Seattle and calculate the walking distance between them in both miles and kilometers",
  "agents": [
    {
      "name": "web_agent",
      "type": "ToolCallingAgent", 
      "description": "Research web content"
    }
  ]
}
```

### GET `/api/models`
Returns available Cerebras models with specs.

---

## 🚀 Deployment

### Backend
Deploy to: **Render**, **Heroku**, **Railway**, **AWS**
```bash
# Set environment variable
CEREBRAS_API_KEY=your-production-key
```

### Frontend  
Deploy to: **Vercel**, **Netlify**, **GitHub Pages**
```bash
npm run build
# Deploy the 'build' folder
```

---

## 💡 Use Cases

- **Research & Analysis**: Multi-source information gathering
- **Data Processing**: Web scraping + computational analysis  
- **Content Creation**: Research-backed content generation
- **Travel Planning**: Destination research + logistics
- **Competitive Analysis**: Market research automation

---

## 🛠️ Development

### Adding New Agents
1. Configure in frontend UI
2. Implement in `backend/app.py`
3. Add to manager's agent list

### Troubleshooting
- **Python version**: Must be 3.10+ for smolagents
- **API key**: Get from https://cloud.cerebras.ai
- **CORS errors**: Backend must run on port 5000
- **Dependencies**: Use separate requirements.txt files

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kevint-cerebras/cerebras-multiagent/issues)
- **Docs**: [Cerebras Documentation](https://cerebras.ai/docs)
- **Framework**: [SmolaGents](https://github.com/smolagents)

---

**Built with ❤️ and powered by Cerebras' lightning-fast inference** 