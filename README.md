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

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (React + TypeScript)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Case Form (textarea, language toggle)                │   │
│  │  • Agent Trace (5 step indicators)                      │   │
│  │  • Draft Viewer (document + cited laws)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓ SSE Stream ↓                         │
├─────────────────────────────────────────────────────────────────┤
│                  Backend (FastAPI + Python)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LangGraph StateGraph (Multi-Agent Workflow)            │   │
│  │  ├─ Intake Agent (classify case)                        │   │
│  │  ├─ Retrieval Agent (RAG via Qdrant)                    │   │
│  │  ├─ Draft Agent (generate legal document)               │   │
│  │  └─ Review Agent (critique & cite)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                     ↓ Embeddings ↓                              │
├─────────────────────────────────────────────────────────────────┤
│  OpenAI API              Qdrant Vector DB        SQLite Cache   │
│  (GPT-4o + Embeddings)   (Legal corpus)          (Sessions)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Agent Workflow

```
User Input (problem description)
         ↓
    INTAKE NODE
    • Classifies case type (consumer, labor, property, etc.)
    • Identifies jurisdiction
    • Assesses urgency level
         ↓
    RETRIEVAL NODE
    • Semantic search in Qdrant for relevant laws
    • Returns top 5 matching sections with scores
         ↓
    DRAFT NODE
    • Generates legal petition/notice
    • Incorporates retrieved laws as context
         ↓
    [Urgency Check]
    ├─ CRITICAL → Skip review, go to END
    └─ Others → REVIEW NODE
         ↓
    REVIEW NODE
    • Self-critique: identifies weaknesses
    • Adds source citations
    • Flags missing information
         ↓
       END
    • Return DraftOutput with all metadata
```

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
```bash
git clone <repo-url>
cd NyayaBot-Multi-Agent-Legal-Aid-System

# Copy environment template
cp .env.example .env

# Edit .env with your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

### 2. Start with Docker Compose
```bash
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **Qdrant**: http://localhost:6333

### 3. Ingest Legal Corpus
```bash
curl -X POST http://localhost:8000/api/ingest
```

This seeds Qdrant with sample legal documents and creates embeddings.

### 4. (Optional) Local Development

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📋 Project Structure

```
NyayaBot/
├── backend/
│   ├── main.py                    # FastAPI app, endpoints, SSE
│   ├── config.py                  # Pydantic settings
│   ├── requirements.txt
│   │
│   ├── models/
│   │   └── schemas.py             # Pydantic: CaseInput, AgentState, DraftOutput
│   │
│   ├── agents/
│   │   ├── graph.py               # LangGraph StateGraph definition
│   │   ├── intake_agent.py        # Case classification
│   │   ├── retrieval_agent.py     # RAG: semantic search
│   │   ├── draft_agent.py         # Legal document generation
│   │   └── review_agent.py        # Self-critique & citations
│   │
│   ├── rag/
│   │   ├── ingest.py              # Chunk, embed, upload to Qdrant
│   │   └── retriever.py           # Semantic search helper
│   │
│   └── data/
│       └── corpus/                # Sample legal documents (.txt)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.cjs
│   ├── index.html
│   │
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── App.css
│       ├── index.css
│       │
│       ├── pages/
│       │   └── Home.tsx           # Single page: input + trace + output
│       │
│       ├── components/
│       │   ├── CaseForm.tsx       # Input form
│       │   ├── AgentTrace.tsx     # Step indicators
│       │   ├── DraftViewer.tsx    # Document + laws
│       │   ├── Header.tsx
│       │   └── Footer.tsx
│       │
│       └── lib/
│           └── stream.ts          # SSE client
│
├── docker-compose.yml
├── Dockerfile.backend
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

### POST `/api/analyze`
Analyze a legal case and return streamed agent output.

**Request:**
```json
{
  "problem_description": "I was unfairly terminated from my job...",
  "language": "en",
  "contact_email": "user@example.com"
}
```

**Response (Server-Sent Events):**
```json
{ "event": "agent_start", "node": "intake", "content": "Processing intake..." }
{ "event": "agent_done", "node": "intake", "content": "Completed intake" }
{ "event": "agent_start", "node": "retrieval", "content": "..." }
...
{ "event": "final", "node": "complete", "content": "{...DraftOutput...}" }
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "qdrant": "connected"
}
```

### POST `/api/ingest`
Admin endpoint: trigger corpus ingestion into Qdrant.

**Response:**
```json
{
  "status": "success",
  "message": "Corpus ingestion completed"
}
```

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

1. **Create agent file** (`backend/agents/new_agent.py`):
   ```python
   from models.schemas import AgentState

   def new_node(state: AgentState) -> AgentState:
       """Your agent logic here."""
       state["new_field"] = "result"
       return state
   ```

2. **Register in graph** (`backend/agents/graph.py`):
   ```python
   workflow.add_node("new_node_name", new_node)
   workflow.add_edge("previous_node", "new_node_name")
   ```

3. **Update AgentState** (`backend/models/schemas.py`) with new fields.

### Type Safety
- All functions have type hints
- Use Pydantic models for I/O
- AgentState is a TypedDict (not a plain dict)

---

## 🌐 Frontend Development Guide

### Component Pattern

```typescript
interface MyComponentProps {
  data: string
  onAction: (value: string) => void
}

export const MyComponent: React.FC<MyComponentProps> = ({ data, onAction }) => {
  return <div>...</div>
}
```

- **Zero `any` types**
- Props are typed interfaces
- Use React.FC for component types

### SSE Subscription
```typescript
import { subscribeToStream, StreamEvent } from '../lib/stream'

const cleanup = subscribeToStream('/api/analyze', {
  onEvent: (event: StreamEvent) => { /* handle event */ },
  onError: (error: Error) => { /* handle error */ },
  onComplete: () => { /* handle completion */ },
})

// Cleanup when component unmounts
useEffect(() => () => cleanup(), [])
```

---

## 🔐 Security Considerations

- **No authentication** for MVP (can add via middleware)
- **CORS enabled** for frontend origin only
- **Environment variables** for sensitive keys (.env)
- **Input validation** via Pydantic
- **Error handling** does not expose internal details

---

## 📊 Sample Workflow

**Input:**
```
"I was fired without notice after 5 years of work. They said it was for poor performance but never gave me any warning. I want to know if this is wrongful termination and what I can do."
```

**Intake Output:**
```json
{
  "case_type": "labor_matter",
  "jurisdiction": "Delhi",
  "urgency": "high"
}
```

**Retrieved Laws:**
```
- Industrial Disputes Act, 1947, Section 25
- Industrial Disputes Act, 1947, Section 11
- Labor Code (pending)
```

**Draft Output:**
```
PETITION FOR RELIEF AGAINST WRONGFUL TERMINATION
[Generated legal document with case details, applicable sections, and prayer for relief]
```

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
