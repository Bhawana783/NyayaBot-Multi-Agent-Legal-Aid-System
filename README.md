# NyayaBot — Multi-Agent Legal Aid System

An AI-powered legal aid platform that provides underserved citizens with **plain-language legal guidance**, **case analysis**, and **drafted legal documents** in Hindi and English.

> **Portfolio Project**: Production-grade full-stack system showcasing LangGraph, FastAPI, React 18, and modern AI/LLM workflows.

---

## 🎯 Problem & Solution

**Problem**: Millions of Indians lack access to affordable legal advice. Court backlogs, geographic barriers, and language gaps prevent citizens from understanding their rights.

**Solution**: NyayaBot uses a multi-agent AI system to:
- 📋 Classify legal cases by type and jurisdiction
- 🔍 Retrieve relevant laws from a vector database
- ✍️ Draft petitions and legal notices
- 📝 Review and cite legal sources
- 🌐 Support both English and Hindi

---

## 🏗️ System Architecture

Multi-tier architecture with React frontend, FastAPI backend, LangGraph agents, and Qdrant vector database.

---

## 🔄 Agent Workflow

Five-stage agent pipeline: Intake → Retrieval → Draft → Review → Output.

---

## 📦 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Python | 3.11+ |
| **Web Framework** | FastAPI | 0.104+ |
| **Agent Orchestration** | LangGraph | 0.0.25+ |
| **LLM Integration** | LangChain | 0.1+ |
| **LLM Provider** | OpenAI (GPT-4o) | - |
| **Embeddings** | OpenAI (text-embedding-3-small) | - |
| **Vector DB** | Qdrant | 2.7+ |
| **Frontend** | React | 18.2+ |
| **Language** | TypeScript | 5.3+ |
| **Styling** | Tailwind CSS | 3.3+ |
| **Build Tool** | Vite | 5.0+ |
| **Containerization** | Docker & Docker Compose | Latest |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local frontend dev)
- OpenAI API key

### 1. Clone & Setup

Clone the repository and set up your environment variables with your OpenAI API key.

### 2. Start with Docker Compose

Start all services (Frontend, Backend, Qdrant) using Docker Compose.

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **Qdrant**: http://localhost:6333

### 3. Ingest Legal Corpus

Trigger corpus ingestion to seed Qdrant with sample legal documents and create embeddings.

### 4. (Optional) Local Development

**Backend**: Set up virtual environment and run Uvicorn with reload mode.

**Frontend**: Install dependencies and run Vite dev server.

---

## 📋 Project Structure

Front-end: React + TypeScript components and pages. Back-end: FastAPI with LangGraph agents. Shared: Docker Compose configuration.

---

## 🔌 API Endpoints

### POST `/api/analyze`
Analyze a legal case and return streamed agent output via Server-Sent Events.

### GET `/api/health`
Health check endpoint returning system and Qdrant connection status.

### POST `/api/ingest`
Admin endpoint: trigger corpus ingestion into Qdrant vector database.

---

## 🎨 UI Design Philosophy

**Linear. Breathable. Zero Decoration.**

- **Color Palette**: Light (#FAFAFA) / Dark (#0D0D0D), minimal accents
- **Typography**: Inter font, 14px base, 400/500 weight only
- **Spacing**: Multiples of 4px, generous whitespace
- **Borders**: 1px solid, radius 4–8px
- **No gradients, shadows, or animations** (except opacity fade-in)
- **Status indicators**: Only circles and text, no spinners or bars

### Layout Zones
1. **Header**: Logo + tagline (13px, minimal)
2. **Input**: Textarea + language toggle + analyze button
3. **Trace**: 5 step circles (intake → retrieve → draft → review → complete)
4. **Output**: Classification pill + document viewer (monospace, line numbers) + cited laws

---

## 📖 Backend Development Guide

### Adding a New Agent Node

1. Create agent file in `backend/agents/`
2. Register in graph at `backend/agents/graph.py`
3. Update AgentState in `backend/models/schemas.py`

### Type Safety
- All functions have type hints
- Use Pydantic models for I/O
- AgentState is a TypedDict (not a plain dict)

---

## 🌐 Frontend Development Guide

### Component Pattern

- Use TypeScript interfaces for props
- Zero `any` types
- Use React.FC for component types

### SSE Subscription

Use the `subscribeToStream` helper from `lib/stream.ts` to handle Server-Sent Events with proper cleanup.

---

## 🔐 Security Considerations

- **No authentication** for MVP (can add via middleware)
- **CORS enabled** for frontend origin only
- **Environment variables** for sensitive keys (.env)
- **Input validation** via Pydantic
- **Error handling** does not expose internal details

---

## 📊 Sample Workflow

User submits legal problem → Intake classifies case → Retrieval finds relevant laws → Draft generates document → Review adds citations → Final output delivered.

---

## 📸 Screenshots Placeholder

*(Add screenshots here after UI is finalized)*

- Input form with case description
- Agent trace during processing
- Final draft viewer with cited laws
- Error state display

---

## 🛠️ Troubleshooting

### Qdrant Connection Error
```
⚠ Qdrant unavailable: Connection refused
```
**Solution**: Ensure Qdrant container is running (`docker ps`), or start with `docker-compose up`.

### OpenAI API Error
```
AuthenticationError: Invalid API key
```
**Solution**: Check `.env` file has valid `OPENAI_API_KEY`.

### SSE Not Streaming
**Solution**: Verify backend CORS is set to frontend origin. Check browser console for errors.

### Build Issues
```bash
# Clean and rebuild
docker-compose down -v
docker-compose up --build
```

---

## 🤝 Built With

- **[LangGraph](https://github.com/langchain-ai/langgraph)** — Multi-agent orchestration
- **[LangChain](https://python.langchain.com)** — LLM integration
- **[FastAPI](https://fastapi.tiangolo.com)** — High-performance async API
- **[Qdrant](https://qdrant.tech)** — Vector database for semantic search
- **[React 18](https://react.dev)** — UI framework
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling
- **[Vite](https://vitejs.dev)** — Next-gen frontend build tool
- **[Docker](https://docker.com)** — Containerization

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💼 Author

**Bhawana** — AI/Data Science Portfolio Project  
Role: Full-Stack AI Engineer + Product Designer

---

## 🚦 Roadmap

- [x] Core LangGraph workflow
- [x] FastAPI SSE streaming
- [x] React single-page app
- [x] Qdrant RAG pipeline
- [ ] User authentication & case history
- [ ] Multi-language support (expand beyond Hi/En)
- [ ] File upload for document analysis
- [ ] n8n webhook integration
- [ ] Admin dashboard
- [ ] Analytics & usage tracking
- [ ] Mobile-responsive design

---

**Questions?** Open an issue or reach out.  
**Want to contribute?** Submit a PR with your improvements!
