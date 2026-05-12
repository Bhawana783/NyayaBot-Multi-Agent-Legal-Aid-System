"""
Intake Agent: Classifies the legal case by type, jurisdiction, and urgency.
"""

from models.schemas import AgentState
from config import settings

from typing import Dict


def intake_node(state: AgentState) -> AgentState:
    """
    Intake agent node: classifies case type, jurisdiction, and urgency.
    
    Returns updated state with:
    - case_type: e.g., "consumer_dispute", "labor_matter", "property_dispute"
    - jurisdiction: e.g., "Delhi", "Mumbai", "National"
    - urgency: "low", "medium", "high", or "critical"
    """
    # If running in mock mode, perform lightweight keyword-based classification
    problem = state.get("problem_description", "")
    language = state.get("language", "en")

    if getattr(settings, "mock_mode", False):
        lower = problem.lower()
        mapping: Dict[str, str] = {
            "landlord": "property_dispute",
            "security deposit": "property_dispute",
            "rent": "property_dispute",
            "consumer": "consumer_dispute",
            "wife": "family",
            "husband": "family",
            "assault": "criminal",
        }

        case_type = "other"
        for k, v in mapping.items():
            if k in lower:
                case_type = v
                break

        jurisdiction = "National"
        urgency = "medium"
        if "urgent" in lower or "emergency" in lower or "immediately" in lower:
            urgency = "high"

        state["case_type"] = case_type
        state["jurisdiction"] = jurisdiction
        state["urgency"] = urgency
        return state

    # Production path using LLM
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.3,
    )

    prompt = f"""Analyze the following legal problem and classify it.
Return your analysis in plain JSON format.

Problem: {problem}
Language preference: {language}

Respond with valid JSON containing:
- case_type: string (e.g., "consumer_dispute", "labor_matter", "property_dispute", "criminal", "civil", "family", "other")
- jurisdiction: string (e.g., "Delhi", "Mumbai", "National", or relevant state)
- urgency: string (one of: "low", "medium", "high", "critical")

JSON output:"""

    response = llm.invoke(prompt)
    content = response.content

    # Parse JSON response
    import json
    try:
        # Try to extract JSON from the response
        json_start = content.find("{")
        json_end = content.rfind("}") + 1
        if json_start != -1 and json_end > json_start:
            json_str = content[json_start:json_end]
            data = json.loads(json_str)
        else:
            data = json.loads(content)
    except (json.JSONDecodeError, ValueError):
        # Fallback if parsing fails
        data = {
            "case_type": "other",
            "jurisdiction": "National",
            "urgency": "medium",
        }

    state["case_type"] = data.get("case_type", "other")
    state["jurisdiction"] = data.get("jurisdiction", "National")
    state["urgency"] = data.get("urgency", "medium")

    return state
