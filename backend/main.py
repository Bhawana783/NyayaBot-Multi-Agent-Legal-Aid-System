"""
FastAPI main application for NyayaBot.
Handles HTTP endpoints, CORS, and SSE streaming for agent output.
"""

import asyncio
import json
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from models.schemas import (
    CaseInput,
    StreamEvent,
    HealthResponse,
    DraftOutput,
    CorpusDashboard,
)
from config import settings
from agents.intake_agent import intake_node
from agents.retrieval_agent import retrieval_node
from agents.draft_agent import draft_node
from agents.review_agent import review_node
from rag.retriever import get_qdrant_client
from rag.corpus_catalog import build_corpus_dashboard


# Global state
qdrant_connected = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context for startup and shutdown."""
    global qdrant_connected
    # Startup
    try:
        client = get_qdrant_client()
        client.get_collection("legal_docs")
        qdrant_connected = True
        print("✓ Qdrant connected")
    except Exception as e:
        print(f"⚠ Qdrant unavailable: {e}")
        qdrant_connected = False

    yield

    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="NyayaBot",
    description="Multi-Agent Legal Aid System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        qdrant="connected" if qdrant_connected else "disconnected",
    )


@app.get("/api/dashboard", response_model=CorpusDashboard)
async def dashboard() -> CorpusDashboard:
    """Return corpus metadata and ready-to-render preview data."""
    payload = build_corpus_dashboard()
    return CorpusDashboard(**payload)


async def case_analysis_stream(case_input: CaseInput) -> AsyncGenerator[str, None]:
    """
    Generator for SSE streaming of agent execution.
    Yields StreamEvent objects as JSON lines.
    """
    # Set initial urgency based on is_urgent flag
    initial_urgency = "critical" if case_input.is_urgent else "medium"
    
    state = {
        "problem_description": case_input.problem_description,
        "language": case_input.language,
        "contact_email": case_input.contact_email,
        "urgency": initial_urgency,
    }

    workflow = [
        ("intake", intake_node),
        ("retrieval", retrieval_node),
        ("draft", draft_node),
    ]

    try:
        for node_name, node_fn in workflow:
            # Stream agent_start event
            start_event = StreamEvent(
                event="agent_start",
                node=node_name,
                content=f"Processing {node_name}...",
            )
            yield f"data: {start_event.model_dump_json()}\n\n"

            # Execute node
            try:
                result = await asyncio.to_thread(node_fn, state)
                state.update(result)
            except Exception as e:
                error_event = StreamEvent(
                    event="error",
                    node=node_name,
                    content=f"Error in {node_name}: {str(e)}",
                )
                yield f"data: {error_event.model_dump_json()}\n\n"
                return

            # Stream agent_done event
            done_event = StreamEvent(
                event="agent_done",
                node=node_name,
                content=f"Completed {node_name}",
            )
            yield f"data: {done_event.model_dump_json()}\n\n"

        if state.get("urgency") != "critical":
            node_name = "review"
            start_event = StreamEvent(
                event="agent_start",
                node=node_name,
                content=f"Processing {node_name}...",
            )
            yield f"data: {start_event.model_dump_json()}\n\n"

            try:
                result = await asyncio.to_thread(review_node, state)
                state.update(result)
            except Exception as e:
                error_event = StreamEvent(
                    event="error",
                    node=node_name,
                    content=f"Error in {node_name}: {str(e)}",
                )
                yield f"data: {error_event.model_dump_json()}\n\n"
                return

            done_event = StreamEvent(
                event="agent_done",
                node=node_name,
                content=f"Completed {node_name}",
            )
            yield f"data: {done_event.model_dump_json()}\n\n"

        # Stream final event with complete output
        final_output = state.get("final_output")
        if not final_output:
            confidence_score = 0.78
            if state.get("retrieved_laws"):
                confidence_score += 0.08
            else:
                confidence_score -= 0.18

            if state.get("urgency") == "critical":
                confidence_score -= 0.12

            confidence_score = max(0.35, min(0.95, confidence_score))
            final_output = DraftOutput(
                case_type=state.get("case_type", "other"),
                jurisdiction=state.get("jurisdiction", "National"),
                urgency=state.get("urgency", "medium"),
                language=state.get("language", "en"),
                retrieved_laws=state.get("retrieved_laws", []),
                drafted_document=state.get("draft", ""),
                review_notes="Skipped due to critical urgency"
                if state.get("urgency") == "critical"
                else "Review completed",
                cited_sections=[],
                confidence_score=confidence_score,
            )

        final_event = StreamEvent(
            event="final",
            node="complete",
            content=final_output.model_dump_json(),
        )
        yield f"data: {final_event.model_dump_json()}\n\n"

    except Exception as e:
        error_event = StreamEvent(
            event="error",
            node="pipeline",
            content=f"Pipeline error: {str(e)}",
        )
        yield f"data: {error_event.model_dump_json()}\n\n"


@app.post("/api/analyze")
async def analyze_case(case_input: CaseInput):
    """
    Analyze legal case with streaming agent output.
    Returns Server-Sent Events stream of agent progress and final output.
    """
    return StreamingResponse(
        case_analysis_stream(case_input),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/ingest")
async def trigger_ingest():
    """
    Admin endpoint: trigger corpus ingestion into Qdrant.
    """
    try:
        from rag.ingest import ingest_corpus

        await asyncio.to_thread(ingest_corpus)
        global qdrant_connected
        qdrant_connected = True
        return {"status": "success", "message": "Corpus ingestion completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=(settings.environment == "development"),
    )
