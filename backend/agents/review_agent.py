"""
Review Agent: Self-critique, source citation, and gap detection.
"""

from models.schemas import AgentState, DraftOutput
from config import settings

from typing import List


def review_node(state: AgentState) -> AgentState:
    """
    Review agent node: critiques the draft, adds citations, and detects gaps.
    
    Returns updated state with:
    - review_notes: critique and improvement suggestions
    - final_output: complete DraftOutput object
    """
    draft = state.get("draft", "")
    retrieved_laws: List = state.get("retrieved_laws", [])
    case_type = state.get("case_type", "")
    jurisdiction = state.get("jurisdiction", "")
    urgency = state.get("urgency", "medium")

    if getattr(settings, "mock_mode", False):
        # Simple mock review notes and confidence scoring
        cited_sections = [f"{law.source}" for law in retrieved_laws]
        review_notes = "Mock review: Document looks structurally complete."
        if not retrieved_laws:
            review_notes += " No supporting laws were retrieved; consider adding citations."

        confidence_score = 0.6 + (0.1 if retrieved_laws else -0.1)
        if urgency == "critical":
            confidence_score -= 0.12
        confidence_score = max(0.35, min(0.95, confidence_score))
        if confidence_score < 0.65:
            review_notes += "\n\nConfidence is low; consult a human lawyer."

        state["review_notes"] = review_notes

        final_output = DraftOutput(
            case_type=case_type,
            jurisdiction=jurisdiction,
            urgency=urgency,
            language=state.get("language", "en"),
            retrieved_laws=retrieved_laws,
            drafted_document=draft,
            review_notes=review_notes,
            cited_sections=cited_sections,
            confidence_score=confidence_score,
        )

        state["final_output"] = final_output
        return state

    # Production path using LLM
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.3,
    )

    # Build context from retrieved laws for citation
    laws_text = ""
    cited_sections = []
    if retrieved_laws:
        for law in retrieved_laws:
            laws_text += f"- {law.source}"
            if law.section:
                section = f"{law.source} Section {law.section}"
                laws_text += f", Section {law.section}"
                cited_sections.append(section)
            laws_text += "\n"

    prompt = f"""You are a senior legal reviewer. Review the following draft legal document.

Draft Document:
{draft}

Applicable Laws:
{laws_text}

Provide:
1. Critique: Any weaknesses, missing elements, or improvements needed
2. Source citations: Verify which laws/sections are properly cited
3. Gap detection: What information is missing that would strengthen the case

Respond in plain text format. Be constructive and specific."""

    response = llm.invoke(prompt)
    review_notes = response.content

    confidence_score = 0.78
    if retrieved_laws:
        confidence_score += 0.08
    else:
        confidence_score -= 0.18

    if urgency == "critical":
        confidence_score -= 0.12

    if len(draft.split()) > 220:
        confidence_score += 0.04

    confidence_score = max(0.35, min(0.95, confidence_score))
    if confidence_score < 0.65:
        review_notes += (
            "\n\nConfidence is low enough that a human lawyer review is strongly recommended."
        )

    state["review_notes"] = review_notes

    # Create final output
    final_output = DraftOutput(
        case_type=case_type,
        jurisdiction=jurisdiction,
        urgency=urgency,
        language=state.get("language", "en"),
        retrieved_laws=retrieved_laws,
        drafted_document=draft,
        review_notes=review_notes,
        cited_sections=cited_sections,
        confidence_score=confidence_score,
    )

    state["final_output"] = final_output

    return state
