"""
Draft Agent: Generates a legal notice or petition based on retrieved laws.
"""

from models.schemas import AgentState
from config import settings

from typing import List


def draft_node(state: AgentState) -> AgentState:
    """
    Draft agent node: generates a legal notice or petition.
    
    Returns updated state with:
    - draft: formatted legal document (petition/notice)
    """
    problem = state.get("problem_description", "")
    case_type = state.get("case_type", "")
    jurisdiction = state.get("jurisdiction", "")
    language = state.get("language", "en")
    retrieved_laws: List = state.get("retrieved_laws", [])

    if getattr(settings, "mock_mode", False):
        # Produce a simple templated draft for UI/testing without billing
        header = f"Legal Notice - {case_type.replace('_', ' ').title()}\nDate: [DATE]\nLocation: [LOCATION]\n\n"
        parties = "Parties:\nPetitioner: [Your Name]\nRespondent: [Other Party]\n\n"
        facts = f"Facts:\n{problem}\n\n"
        grounds = "Legal Grounds:\n"
        if retrieved_laws:
            for law in retrieved_laws:
                grounds += f"- {law.source} (relevance: {law.relevance_score})\n"
        else:
            grounds += "- Relevant statutory provisions to be determined.\n"

        prayer = "Prayer:\nThe petitioner respectfully requests the following relief: [Specify relief].\n"

        draft = header + parties + facts + grounds + "\n" + prayer
        state["draft"] = draft
        return state

    # Production path using LLM
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.4,
    )

    # Build context from retrieved laws
    laws_context = ""
    if retrieved_laws:
        laws_context = "Applicable Laws:\n"
        for law in retrieved_laws:
            laws_context += f"- {law.source}"
            if law.section:
                laws_context += f", Section {law.section}"
            laws_context += f": {law.content[:200]}...\n"

    language_instruction = (
        "Write in Hindi (Devanagari script)." if language == "hi" else "Write in English."
    )

    prompt = f"""You are a legal document drafter. Draft a legal petition or notice based on the following case details.

Case Type: {case_type}
Jurisdiction: {jurisdiction}
Language: {language_instruction}

Problem Description:
{problem}

{laws_context}

Create a professional legal document with:
1. Header: Document type (Petition/Notice) with date and location
2. Parties: Petitioner and Respondent (use placeholders if needed)
3. Facts: Concise statement of facts from the problem description
4. Legal Grounds: Reference to applicable laws
5. Prayer: Requested relief

Keep the document concise, formal, and professional. Use proper legal formatting."""

    response = llm.invoke(prompt)
    draft = response.content

    state["draft"] = draft

    return state
