"""
Retrieval Agent: Performs semantic search in Qdrant to find relevant laws.
"""

from models.schemas import AgentState, RetrievedLaw
from rag.retriever import legal_retriever
from config import settings

try:
    # used only in mock mode to surface corpus previews
    from rag.corpus_catalog import build_corpus_dashboard
except Exception:
    build_corpus_dashboard = None


def retrieval_node(state: AgentState) -> AgentState:
    """
    Retrieval agent node: searches Qdrant for relevant laws.
    
    Returns updated state with:
    - retrieved_laws: list of RetrievedLaw objects (top 5 results)
    """
    problem = state.get("problem_description", "")
    case_type = state.get("case_type", "")
    jurisdiction = state.get("jurisdiction", "")

    # Build query with context
    query = f"legal problem: {problem}. case type: {case_type}. jurisdiction: {jurisdiction}"

    # If running in mock mode, return simple preview-based retrieved laws
    retrieved_laws = []
    if getattr(settings, "mock_mode", False):
        try:
            dashboard = build_corpus_dashboard() if build_corpus_dashboard else {}
            featured = dashboard.get("featured_sources", [])[:3] if dashboard else []
            for idx, src in enumerate(featured):
                retrieved_laws.append(
                    RetrievedLaw(
                        source=src.get("title", src.get("file_name", "Unknown")),
                        section=None,
                        content=(src.get("summary") or src.get("focus") or "Relevant law excerpt"),
                        relevance_score=0.75 - idx * 0.1,
                    )
                )
        except Exception:
            retrieved_laws = []
    else:
        # Retrieve top 5 relevant laws
        results = legal_retriever(query, top_k=5)

        for result in results:
            law = RetrievedLaw(
                source=result.get("source", "Unknown"),
                section=result.get("section"),
                content=result.get("content", ""),
                relevance_score=result.get("relevance_score", 0.0),
            )
            retrieved_laws.append(law)

    state["retrieved_laws"] = retrieved_laws

    return state
