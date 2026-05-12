"""
LangGraph state graph definition for the multi-agent legal aid workflow.
"""

from langgraph.graph import StateGraph, END
from typing import Optional, cast
from models.schemas import AgentState, StreamEvent


def create_legal_aid_graph():
    """
    Create and return the compiled LangGraph StateGraph for legal case analysis.
    
    Workflow:
    intake_node → retrieval_node → draft_node → [conditional] → review_node or END
    """
    from agents.intake_agent import intake_node
    from agents.retrieval_agent import retrieval_node
    from agents.draft_agent import draft_node
    from agents.review_agent import review_node

    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("retrieval", retrieval_node)
    workflow.add_node("draft", draft_node)
    workflow.add_node("review", review_node)

    # Add edges
    workflow.add_edge("intake", "retrieval")
    workflow.add_edge("retrieval", "draft")

    # Conditional edge: if urgency is critical, skip review
    def should_review(state: AgentState) -> str:
        """Decide whether to review or go directly to END."""
        urgency = state.get("urgency", "medium")
        if urgency == "critical":
            return END
        return "review"

    workflow.add_conditional_edges("draft", should_review, {"review": "review", END: END})
    workflow.add_edge("review", END)

    # Set entry point
    workflow.set_entry_point("intake")

    return workflow.compile()


# Lazy-load compiled graph
_graph = None


def get_graph():
    """Get or create the compiled LangGraph."""
    global _graph
    if _graph is None:
        _graph = create_legal_aid_graph()
    return _graph
