"""Utilities for summarizing the legal corpus shipped with NyayaBot."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen


def get_corpus_dir() -> Path:
    """Return the path to the local corpus directory."""
    return Path(__file__).resolve().parents[1] / "data" / "corpus"


def _read_excerpt(file_path: Path, max_chars: int = 260) -> str:
    try:
        content = file_path.read_text(encoding="utf-8").strip().replace("\r", "")
    except Exception:
        return ""

    if len(content) <= max_chars:
        return content

    excerpt = content[:max_chars].rsplit(" ", 1)[0].strip()
    return f"{excerpt}..."


def _title_from_name(file_path: Path) -> str:
    return file_path.stem.replace("_", " ")


def _category_from_name(file_name: str) -> str:
    normalized = file_name.lower()
    if "consumer" in normalized:
        return "Consumer"
    if "labor" in normalized or "industrial" in normalized:
        return "Labour"
    if "property" in normalized:
        return "Property"
    if "hindu" in normalized or "succession" in normalized:
        return "Family"
    if "penal" in normalized:
        return "Criminal"
    if "rti" in normalized:
        return "Transparency"
    return "General"


def list_corpus_sources(limit: int = 6) -> list[dict[str, Any]]:
    """Return a small set of real legal corpus sources for dashboard rendering."""
    corpus_dir = get_corpus_dir()
    if not corpus_dir.exists():
        return []

    sources: list[dict[str, Any]] = []
    for file_path in sorted(corpus_dir.glob("*.txt")):
        title = _title_from_name(file_path)
        sources.append(
            {
                "title": title,
                "file_name": file_path.name,
                "category": _category_from_name(file_path.stem),
                "summary": _read_excerpt(file_path),
                "focus": f"Real legal text from {title}",
            }
        )

    return sources[:limit]


def build_corpus_dashboard() -> dict[str, Any]:
    """Build a lightweight dashboard payload from the local corpus."""
    corpus_dir = get_corpus_dir()
    sources = list_corpus_sources(limit=4)
    file_paths = sorted(corpus_dir.glob("*.txt")) if corpus_dir.exists() else []
    category_counts = Counter(
        _category_from_name(file_path.stem) for file_path in file_paths
    )

    return {
        "corpus_count": len(file_paths),
        "top_categories": [
            {"name": name, "count": count}
            for name, count in category_counts.most_common(5)
        ],
        "featured_sources": sources,
        "official_sources": fetch_official_sources(),
        "jurisdiction": "India",
    }


class _AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, str]] = []
        self._current_href: str | None = None
        self._current_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            attributes = dict(attrs)
            self._current_href = attributes.get("href")
            self._current_text = []

    def handle_data(self, data: str) -> None:
        if self._current_href:
            self._current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._current_href:
            text = " ".join(" ".join(self._current_text).split())
            if text:
                self.links.append({"href": self._current_href, "text": text})
            self._current_href = None
            self._current_text = []


def fetch_official_sources(limit: int = 6) -> list[dict[str, Any]]:
    """Fetch safe official Indian legal source links with a fallback list."""
    fallback_sources = [
        {
            "title": "India Code",
            "url": "https://www.indiacode.nic.in/",
            "description": "Official portal for Central and State Acts, repealed acts, and legislative references.",
            "source": "Government of India",
        },
        {
            "title": "Repealed Acts",
            "url": "https://www.indiacode.nic.in/repealed-act/repealed-act.jsp",
            "description": "Official archive of repealed acts maintained by India Code.",
            "source": "Government of India",
        },
        {
            "title": "Spent Acts",
            "url": "https://www.indiacode.nic.in/spent-act/spent-act.jsp",
            "description": "Official list of spent acts available from India Code.",
            "source": "Government of India",
        },
        {
            "title": "Legislative Department",
            "url": "https://legislative.gov.in/",
            "description": "Central legislative department portal for Indian legal references and drafting resources.",
            "source": "Government of India",
        },
        {
            "title": "Department of Legal Affairs",
            "url": "https://legalaffairs.gov.in/",
            "description": "Official legal affairs portal with government legal notices and updates.",
            "source": "Government of India",
        },
        {
            "title": "eGazette of India",
            "url": "https://egazette.nic.in/",
            "description": "Official gazette for notified laws, orders, and statutory publications.",
            "source": "Government of India",
        },
    ]

    try:
        request = Request(
            "https://www.indiacode.nic.in/",
            headers={"User-Agent": "NyayaBot/1.0"},
        )
        with urlopen(request, timeout=8) as response:  # nosec: safe official domain
            html_text = response.read().decode("utf-8", errors="ignore")

        parser = _AnchorParser()
        parser.feed(html_text)

        live_links: list[dict[str, Any]] = []
        seen_urls: set[str] = set()
        keywords = (
            "act",
            "repealed",
            "spent",
            "legislative",
            "legal",
            "gazette",
            "reference",
        )

        for link in parser.links:
            absolute_url = urljoin("https://www.indiacode.nic.in/", link["href"])
            title = link["text"]
            if not title or absolute_url in seen_urls:
                continue
            if any(keyword in f"{title} {absolute_url}".lower() for keyword in keywords):
                live_links.append(
                    {
                        "title": title[:80],
                        "url": absolute_url,
                        "description": "Official India Code reference discovered from the live portal.",
                        "source": "India Code",
                    }
                )
                seen_urls.add(absolute_url)

            if len(live_links) >= limit:
                break

        if live_links:
            return live_links
    except Exception:
        pass

    return fallback_sources[:limit]