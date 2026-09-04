"""
Deterministic ML Scoring & Keyword Extraction Engine
Combines Sentence-Transformers dense semantic embeddings, KeyBERT n-gram extraction,
quantification metrics density, and structural ATS integrity validation.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Set, Tuple
import numpy as np

# Lazy / Singleton ML Model Container
_EMBEDDING_MODEL = None
_KEYBERT_MODEL = None
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Standard Tech Synonym Dictionary for Normalization
TECH_SYNONYMS: Dict[str, str] = {
    r"\bnodejs\b": "Node.js",
    r"\bnode\.js\b": "Node.js",
    r"\breactjs\b": "React",
    r"\breact\.js\b": "React",
    r"\bvuejs\b": "Vue",
    r"\bvue\.js\b": "Vue",
    r"\bangularjs\b": "Angular",
    r"\bnextjs\b": "Next.js",
    r"\bnext\.js\b": "Next.js",
    r"\bgolang\b": "Go",
    r"\bk8s\b": "Kubernetes",
    r"\bpostgres\b": "PostgreSQL",
    r"\bpostgresql\b": "PostgreSQL",
    r"\bmongo\b": "MongoDB",
    r"\bmongodb\b": "MongoDB",
    r"\bts\b": "TypeScript",
    r"\bjs\b": "JavaScript",
    r"\baws\s+cloud\b": "AWS",
    r"\bgcp\b": "Google Cloud",
    r"\bci[\/\-]cd\b": "CI/CD",
    r"\brest\s*api[s]?\b": "REST APIs",
    r"\bgraphql\b": "GraphQL",
    r"\bdocker\b": "Docker",
}

# Common Technical Taxonomy Reference
KNOWN_TECH_TAXONOMY: Set[str] = {
    "python", "javascript", "typescript", "react", "node.js", "angular", "vue", "next.js",
    "go", "java", "c++", "c#", "rust", "sql", "postgresql", "mysql", "mongodb", "redis",
    "kafka", "rabbitmq", "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "ci/cd", "git", "github", "linux", "graphql", "rest apis", "microservices", "system design",
    "fastapi", "django", "flask", "express", "spring boot", "pandas", "numpy", "pytorch",
    "tensorflow", "scikit-learn", "machine learning", "deep learning", "nlp", "llm", "genai",
    "agile", "scrum", "jira", "pytest", "unit testing", "elasticsearch", "celery", "airflow"
}


def get_embedding_model():
    """Singleton getter for SentenceTransformer to optimize memory and cold starts."""
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        from sentence_transformers import SentenceTransformer
        _EMBEDDING_MODEL = SentenceTransformer(MODEL_NAME)
    return _EMBEDDING_MODEL


def get_keybert_model():
    """Singleton getter for KeyBERT model using the shared embedding instance."""
    global _KEYBERT_MODEL
    if _KEYBERT_MODEL is None:
        from keybert import KeyBERT
        base_model = get_embedding_model()
        _KEYBERT_MODEL = KeyBERT(model=base_model)
    return _KEYBERT_MODEL


def normalize_text(text: str) -> str:
    """
    Cleans non-ASCII characters, normalizes whitespace,
    and unifies common technical synonyms.
    """
    if not text:
        return ""

    # Normalize unicode to ASCII
    cleaned = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8", "ignore")

    # Replace common tech aliases with canonical names
    for pattern, canonical in TECH_SYNONYMS.items():
        cleaned = re.sub(pattern, canonical, cleaned, flags=re.IGNORECASE)

    # Clean excessive whitespace and preserve layout readability
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()


def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    """
    Computes dense semantic embeddings using all-MiniLM-L6-v2 and calculates
    cosine similarity mapped to a normalized 0-100 score.
    """
    if not resume_text.strip() or not jd_text.strip():
        return 50.0

    model = get_embedding_model()

    # Truncate to reasonable sequence limits to prevent OOM
    resume_chunk = resume_text[:6000]
    jd_chunk = jd_text[:4000]

    embeddings = model.encode([resume_chunk, jd_chunk], normalize_embeddings=True)
    cos_sim = float(np.dot(embeddings[0], embeddings[1]))

    # Cosine similarity for all-MiniLM-L6-v2 usually ranges between 0.2 and 0.85
    # Normalizing with high-contrast sigmoid-linear scaling for accurate ATS scoring:
    normalized_score = max(0.0, min(100.0, ((cos_sim - 0.20) / 0.65) * 100.0))
    return round(normalized_score, 2)


def extract_keywords(text: str, top_n: int = 25) -> List[str]:
    """
    Uses KeyBERT with 1-3 n-grams and strict frequency filtering
    to extract salient domain competencies and technical keywords.
    """
    if not text or len(text.strip()) < 20:
        return []

    kw_model = get_keybert_model()
    try:
        raw_keywords = kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 3),
            stop_words="english",
            use_mmr=True,
            diversity=0.4,
            top_n=top_n
        )
        candidates = [kw[0].lower().strip() for kw in raw_keywords if kw[1] > 0.15]
    except Exception:
        # Fallback to regex tokenization
        words = re.findall(r"\b[a-zA-Z0-9.+/#-]{2,25}\b", text.lower())
        candidates = list(set(w for w in words if w in KNOWN_TECH_TAXONOMY))

    # Augment with exact taxonomy matches present in text
    lower_text = text.lower()
    for tech in KNOWN_TECH_TAXONOMY:
        if tech in lower_text and tech not in candidates:
            candidates.append(tech)

    return list(dict.fromkeys(candidates))


def compute_keyword_match(
    resume_text: str, jd_text: str
) -> Tuple[float, List[str], List[str], List[str]]:
    """
    Computes intersection percentage between Job Description requirements
    and candidate Resume text. Returns (score, matched_keywords, missing_keywords, all_jd_keywords).
    """
    jd_keywords = extract_keywords(jd_text, top_n=30)
    if not jd_keywords:
        return 75.0, [], [], []

    resume_lower = resume_text.lower()

    matched: List[str] = []
    missing: List[str] = []

    for kw in jd_keywords:
        # Match exact token or substring
        kw_regex = rf"\b{re.escape(kw)}\b"
        if re.search(kw_regex, resume_lower) or kw in resume_lower:
            matched.append(kw)
        else:
            missing.append(kw)

    match_ratio = len(matched) / len(jd_keywords) if jd_keywords else 0.75
    keyword_score = round(min(100.0, max(20.0, match_ratio * 100.0)), 2)

    return keyword_score, matched, missing, jd_keywords


def compute_metric_density(resume_text: str) -> Tuple[float, int, List[str]]:
    """
    Inspects text for quantified impact indicators (e.g., percentages, metrics,
    dollar values, multipliers '3x', '10k+ users').
    """
    metric_patterns = [
        r"\b\d+%\b",                                        # Percentages: 45%, 100%
        r"\$\s*\d+[\d,.]*(?:[kmbKMB])?\b",                  # Dollar amounts: $500k, $2.5M
        r"\b\d+(?:\.\d+)?x\b",                              # Multipliers: 3x, 10x, 2.5x
        r"\b\d+\s*(?:[kmbKMB])\+?\b",                       # Counts: 100k+, 10M
        r"\b\d+\+\s*(?:users|clients|engineers|teams|projects|services|endpoints|qps|tps|rps)\b", # Contextual hits
        r"\b(?:reduced|increased|improved|boosted|saved|scaled)\s+by\s+\d+%\b", # Impact statements
    ]

    detected_metrics: List[str] = []
    for pattern in metric_patterns:
        matches = re.findall(pattern, resume_text, flags=re.IGNORECASE)
        for m in matches:
            if m not in detected_metrics:
                detected_metrics.append(m)

    metric_count = len(detected_metrics)

    # 0 metrics -> 30, 1-2 -> 60, 3-5 -> 85, 6+ -> 100
    if metric_count >= 6:
        score = 100.0
    elif metric_count >= 4:
        score = 88.0
    elif metric_count >= 2:
        score = 70.0
    elif metric_count == 1:
        score = 55.0
    else:
        score = 35.0

    return round(score, 2), metric_count, detected_metrics[:10]


def compute_structure_integrity(resume_text: str) -> Tuple[float, List[str], List[str]]:
    """
    Checks for mandatory standard ATS section headers ('Experience', 'Education', 'Skills', 'Projects')
    and flags formatting risks like table delimiters or excessive non-alphanumeric noise.
    """
    section_patterns = {
        "Experience": r"\b(experience|work history|employment history|professional experience)\b",
        "Education": r"\b(education|academic background|degree|university|qualifications)\b",
        "Skills": r"\b(skills|technical skills|technologies|core competencies|toolset)\b",
        "Projects": r"\b(projects|featured projects|portfolio|key achievements)\b",
        "Summary": r"\b(summary|professional summary|profile|about me|executive summary)\b",
    }

    found_sections: List[str] = []
    missing_sections: List[str] = []

    for section_name, pattern in section_patterns.items():
        if re.search(pattern, resume_text, flags=re.IGNORECASE):
            found_sections.append(section_name)
        else:
            if section_name != "Summary":  # Summary is recommended but non-blocking
                missing_sections.append(section_name)

    formatting_hazards: List[str] = []

    # Check for excessive pipe/table delimiters
    pipe_count = resume_text.count("|")
    if pipe_count > 15:
        formatting_hazards.append("High table delimiter density detected (may disrupt legacy ATS parsers)")

    # Check word length bounds
    words = resume_text.split()
    if len(words) < 180:
        formatting_hazards.append("Resume length is below standard threshold (< 180 words)")
    elif len(words) > 1500:
        formatting_hazards.append("Resume exceeds standard 2-page length (> 1500 words)")

    # Score calculation
    mandatory_found = len([s for s in found_sections if s != "Summary"])
    base_score = (mandatory_found / 4.0) * 80.0 + (20.0 if "Summary" in found_sections else 10.0)
    penalty = len(formatting_hazards) * 10.0
    final_struct_score = max(20.0, min(100.0, base_score - penalty))

    return round(final_struct_score, 2), missing_sections, formatting_hazards


def run_deterministic_scoring_pipeline(
    resume_text: str, jd_text: str
) -> Dict[str, Any]:
    """
    Executes the comprehensive deterministic ML scoring pipeline:
    - Semantic Similarity (40%)
    - Keyword & Skill Match (35%)
    - Metric Density (15%)
    - Structure Integrity (10%)
    """
    clean_resume = normalize_text(resume_text)
    clean_jd = normalize_text(jd_text)

    # 1. Semantic Similarity (40%)
    semantic_score = compute_semantic_similarity(clean_resume, clean_jd)

    # 2. Keyword & Skill Match (35%)
    keyword_score, matched_kws, missing_kws, all_jd_kws = compute_keyword_match(clean_resume, clean_jd)

    # 3. Metric Density (15%)
    metric_score, metric_count, detected_metrics = compute_metric_density(clean_resume)

    # 4. Structure & Section Integrity (10%)
    structure_score, missing_sections, formatting_hazards = compute_structure_integrity(clean_resume)

    # Strictly Weighted Deterministic Total Score
    total_ats_score = round(
        (0.40 * semantic_score) +
        (0.35 * keyword_score) +
        (0.15 * metric_score) +
        (0.10 * structure_score),
        2
    )

    return {
        "final_ats_score": total_ats_score,
        "score_breakdown": {
            "semantic_similarity": {
                "score": semantic_score,
                "weight_percent": 40,
                "weighted_contribution": round(0.40 * semantic_score, 2),
            },
            "keyword_match": {
                "score": keyword_score,
                "weight_percent": 35,
                "weighted_contribution": round(0.35 * keyword_score, 2),
            },
            "metric_density": {
                "score": metric_score,
                "weight_percent": 15,
                "weighted_contribution": round(0.15 * metric_score, 2),
            },
            "structure_integrity": {
                "score": structure_score,
                "weight_percent": 10,
                "weighted_contribution": round(0.10 * structure_score, 2),
            },
        },
        "keywords": {
            "matched": matched_kws,
            "missing_critical": missing_kws,
            "total_jd_keywords_count": len(all_jd_kws),
            "match_rate_percentage": round((len(matched_kws) / len(all_jd_kws) * 100), 1) if all_jd_kws else 100.0,
        },
        "quantification": {
            "metric_count": metric_count,
            "sample_metrics": detected_metrics,
        },
        "structure": {
            "missing_sections": missing_sections,
            "formatting_hazards": formatting_hazards,
            "word_count": len(clean_resume.split()),
        },
    }
