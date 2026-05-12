"""
Pydantic schemas for NyayaBot API and internal state management.
"""

from typing import Literal, Optional, TypedDict, Any
from pydantic import BaseModel, EmailStr, Field


class CaseInput(BaseModel):
    """Input model for case analysis."""

    problem_description: str = Field(
        ..., min_length=10, description="Description of the legal problem"
    )
    language: Literal["en", "hi"] = Field("en", description="Language preference")
    contact_email: Optional[str] = Field(None, description="Optional contact email")
    is_urgent: bool = Field(False, description="Whether this is an urgent/critical matter")


class RetrievedLaw(BaseModel):
    """A single retrieved legal document or section."""

    source: str = Field(..., description="Name of the legal document/act")
    section: Optional[str] = Field(None, description="Section number if applicable")
    content: str = Field(..., description="Relevant text snippet")
    relevance_score: float = Field(..., ge=0.0, le=1.0)


class AgentState(TypedDict, total=False):
    """
    State object passed between LangGraph nodes.
    Using TypedDict for type safety across agent nodes.
    """

    case_type: str
    jurisdiction: str
    urgency: Literal["low", "medium", "high", "critical"]
    language: Literal["en", "hi"]
    problem_description: str
    contact_email: Optional[str]
    retrieved_laws: list[RetrievedLaw]
    draft: str
    review_notes: str
    final_output: Optional["DraftOutput"]
    error: Optional[str]


class DraftOutput(BaseModel):
    """Final output after all agent processing."""

    case_type: str
    jurisdiction: str
    urgency: Literal["low", "medium", "high", "critical"]
    language: Literal["en", "hi"]
    retrieved_laws: list[RetrievedLaw]
    drafted_document: str
    review_notes: str
    cited_sections: list[str] = Field(default_factory=list)
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Estimated confidence in the analysis"
    )


class CorpusSourcePreview(BaseModel):
    """Preview data for a corpus source surfaced in the dashboard."""

    title: str
    file_name: str
    category: str
    summary: str
    focus: str


class OfficialSourcePreview(BaseModel):
    """Preview data for a live official legal source."""

    title: str
    url: str
    description: str
    source: str


class CorpusDashboard(BaseModel):
    """High-level dashboard payload for corpus and system status."""

    corpus_count: int
    jurisdiction: str
    top_categories: list[dict[str, Any]] = Field(default_factory=list)
    featured_sources: list[CorpusSourcePreview] = Field(default_factory=list)
    official_sources: list[OfficialSourcePreview] = Field(default_factory=list)


class StreamEvent(BaseModel):
    """Event streamed to client during agent processing."""

    event: Literal["agent_start", "agent_done", "final", "error"]
    node: str = Field(..., description="Name of the agent node")
    content: str = Field(..., description="Event content or result")
    timestamp: Optional[float] = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: Literal["ok", "error"]
    qdrant: Literal["connected", "disconnected"]
    message: Optional[str] = None
