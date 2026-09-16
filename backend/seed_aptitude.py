"""Load the aptitude question bank into Supabase.

Usage (from the backend/ folder, with the virtualenv active):
    python seed_aptitude.py                 seed from ../data/aptiqbank.json
    python seed_aptitude.py --file path.json
    python seed_aptitude.py --dry-run       validate the file without writing

Rows are upserted on `external_id` ("<source>-<id from the file>"), so re-running the
command updates existing questions instead of creating duplicates. Requires
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env, and migration 0002 applied.
"""

import argparse
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any

from app.config import BACKEND_DIR, get_settings
from app.database import Repository, get_supabase_client
from app.services.aptitude import DIFFICULTIES

DEFAULT_BANK = BACKEND_DIR.parent / "data" / "aptiqbank.json"
DEFAULT_SOURCE = "aptiqbank"
BATCH_SIZE = 100

# The file numbers its questions ("Q37. Two numbers ..."), which would contradict the
# position a question lands in once a quiz is randomised.
LEADING_NUMBER = re.compile(r"^\s*Q\s*\d+\s*[.):-]\s*")

NON_SLUG_CHARS = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    return NON_SLUG_CHARS.sub("-", text.lower()).strip("-")

logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(message)s")
logger = logging.getLogger("seed_aptitude")


class InvalidQuestionError(ValueError):
    pass


def normalize_question(item: dict[str, Any], source: str) -> dict[str, Any]:
    """Map one bank entry onto an aptitude_questions row, or raise InvalidQuestionError."""
    external_ref = item.get("id")
    if external_ref is None:
        raise InvalidQuestionError("missing 'id'")

    text = LEADING_NUMBER.sub("", str(item.get("questionText") or "")).strip()
    if not text:
        raise InvalidQuestionError("empty 'questionText'")

    options = [str(option).strip() for option in item.get("options") or []]
    if len(options) < 2:
        raise InvalidQuestionError("needs at least 2 options")

    correct_index = item.get("correctOptionIndex")
    if not isinstance(correct_index, int) or not 0 <= correct_index < len(options):
        raise InvalidQuestionError(f"'correctOptionIndex' {correct_index!r} is out of range")

    difficulty = str(item.get("difficulty") or "").strip().lower()
    if difficulty not in DIFFICULTIES:
        raise InvalidQuestionError(f"difficulty {difficulty!r} is not one of {DIFFICULTIES}")

    category = str(item.get("category") or "").strip()
    if not category:
        raise InvalidQuestionError("missing 'category'")

    return {
        # The file numbers questions per category, so the category is part of the key.
        "external_id": f"{source}-{slugify(category)}-{external_ref}",
        "source": source,
        "category": category,
        "topic": str(item.get("topic") or "").strip() or None,
        "difficulty": difficulty,
        "questionText": text,
        "options": options,
        "correctOptionIndex": correct_index,
        "explanation": str(item.get("explanation") or "").strip() or None,
    }


def load_bank(path: Path, source: str) -> tuple[list[dict[str, Any]], list[str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        # Tolerate {"questions": [...]} as well as a bare list.
        payload = payload.get("questions") or payload.get("data") or []
    if not isinstance(payload, list):
        raise ValueError(f"{path.name} must contain a JSON array of questions")

    rows: list[dict[str, Any]] = []
    problems: list[str] = []
    for position, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            problems.append(f"entry #{position}: not an object")
            continue
        try:
            rows.append(normalize_question(item, source))
        except InvalidQuestionError as exc:
            problems.append(f"entry #{position} (id={item.get('id')!r}): {exc}")

    seen: dict[str, int] = {}
    unique_rows = []
    for row in rows:
        if row["external_id"] in seen:
            problems.append(f"duplicate id {row['external_id']} - keeping the first occurrence")
            continue
        seen[row["external_id"]] = 1
        unique_rows.append(row)
    return unique_rows, problems


def summarize(rows: list[dict[str, Any]]) -> None:
    by_category: dict[str, dict[str, int]] = {}
    for row in rows:
        counts = by_category.setdefault(row["category"], {level: 0 for level in DIFFICULTIES})
        counts[row["difficulty"]] += 1
    logger.info("%d question(s) across %d categories:", len(rows), len(by_category))
    for category, counts in sorted(by_category.items()):
        detail = ", ".join(f"{level}: {counts[level]}" for level in DIFFICULTIES)
        logger.info("  %-34s %3d  (%s)", category, sum(counts.values()), detail)


def run(path: Path, source: str, dry_run: bool) -> int:
    if not path.exists():
        logger.error("Question bank not found: %s", path)
        return 1

    try:
        rows, problems = load_bank(path, source)
    except (ValueError, json.JSONDecodeError) as exc:
        logger.error("Could not read %s: %s", path.name, exc)
        return 1

    for problem in problems:
        logger.warning("Skipped %s", problem)
    if not rows:
        logger.error("No valid questions found in %s", path.name)
        return 1

    summarize(rows)
    if dry_run:
        logger.info("Dry run - nothing was written.")
        return 0

    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        logger.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")
        return 1

    repo = Repository(get_supabase_client())
    written = 0
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start : start + BATCH_SIZE]
        try:
            written += repo.upsert_aptitude_questions(batch)
        except Exception as exc:
            logger.error("Upsert failed at row %d: %s", start + 1, exc)
            logger.error("Have you run `python migrate.py`? Migration 0002 adds the external_id key.")
            return 1
        logger.info("Upserted %d/%d ...", min(start + BATCH_SIZE, len(rows)), len(rows))

    logger.info("Done. %d question(s) are in the bank from source '%s'.", written, source)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--file", type=Path, default=DEFAULT_BANK, help=f"question bank JSON (default: {DEFAULT_BANK})")
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="source tag stored on each row")
    parser.add_argument("--dry-run", action="store_true", help="validate and summarise without writing")
    args = parser.parse_args()
    return run(args.file, args.source, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
