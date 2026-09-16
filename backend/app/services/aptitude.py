"""Aptitude quiz assembly and grading.

Pure functions over question rows, so the router stays thin and the draw logic is
testable without Supabase. Two rules drive the design:

* No repeats: a draw prefers questions the candidate has not seen in their recent
  quizzes for the same settings, and reuses seen ones only when the pool runs dry.
* No leaked answers: options are re-ordered per quiz and the permutation is stored
  server-side, so the browser receives questions without `correctOptionIndex`.
"""

import random
from typing import Any

DIFFICULTIES = ("easy", "medium", "hard")
MIXED = "mixed"

# Weights used when difficulty is "mixed". The bank leans medium and so does a
# realistic paper; any shortfall is topped up from whatever the pool still holds.
MIXED_WEIGHTS = {"easy": 0.3, "medium": 0.45, "hard": 0.25}

SECONDS_PER_QUESTION = 60


class NotEnoughQuestionsError(Exception):
    """Raised when the bank holds no question matching the requested settings."""


def filter_pool(
    questions: list[dict[str, Any]],
    category: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
) -> list[dict[str, Any]]:
    pool = questions
    if category:
        pool = [q for q in pool if q.get("category") == category]
    if topic:
        pool = [q for q in pool if q.get("topic") == topic]
    if difficulty and difficulty != MIXED:
        pool = [q for q in pool if q.get("difficulty") == difficulty]
    return pool


def _draw(pool: list[dict[str, Any]], count: int, seen_ids: set[Any], rng: random.Random) -> list[dict[str, Any]]:
    """Take `count` questions, exhausting unseen ones before reusing seen ones."""
    if count <= 0:
        return []
    unseen = [q for q in pool if q["id"] not in seen_ids]
    seen = [q for q in pool if q["id"] in seen_ids]
    rng.shuffle(unseen)
    rng.shuffle(seen)
    return (unseen + seen)[:count]


def _allocate(count: int, weights: dict[str, float], capacity: dict[str, int]) -> dict[str, int]:
    """Split `count` places across levels by weight, never exceeding a level's capacity.

    Handing out one place at a time to whichever level is furthest below its target
    share keeps the total exact: rounding each level separately would over- or
    under-request, and an over-request silently costs unseen questions elsewhere.
    """
    allocation = {level: 0 for level in weights}
    for _ in range(count):
        open_levels = [level for level in weights if allocation[level] < capacity.get(level, 0)]
        if not open_levels:
            break
        allocation[max(open_levels, key=lambda level: weights[level] * count - allocation[level])] += 1
    return allocation


def _mixed_draw(pool: list[dict[str, Any]], count: int, seen_ids: set[Any], rng: random.Random) -> list[dict[str, Any]]:
    """Draw across difficulties in roughly MIXED_WEIGHTS proportions.

    Levels are capped by how many *unseen* questions they hold, so a level that has
    run dry gives its places to the others rather than forcing an early repeat.
    """
    by_difficulty = {level: [q for q in pool if q.get("difficulty") == level] for level in DIFFICULTIES}
    unseen_capacity = {
        level: sum(1 for question in questions if question["id"] not in seen_ids)
        for level, questions in by_difficulty.items()
    }

    picked: list[dict[str, Any]] = []
    for level, take in _allocate(count, MIXED_WEIGHTS, unseen_capacity).items():
        picked.extend(_draw(by_difficulty[level], take, seen_ids, rng))

    if len(picked) < count:
        # Every level is out of unseen questions (or the bank uses another difficulty
        # label), so top up from the whole pool and accept repeats.
        chosen = {question["id"] for question in picked}
        remaining = [question for question in pool if question["id"] not in chosen]
        picked.extend(_draw(remaining, count - len(picked), seen_ids, rng))

    rng.shuffle(picked)
    return picked[:count]


def build_quiz_paper(
    pool: list[dict[str, Any]],
    count: int,
    difficulty: str | None = None,
    seen_ids: set[Any] | None = None,
    rng: random.Random | None = None,
) -> list[dict[str, Any]]:
    """Pick the questions for one quiz and shuffle each question's options.

    Returns paper entries of the form `{"questionId": ..., "optionOrder": [...]}`,
    where `optionOrder[displayedIndex]` indexes into the question's stored options.
    """
    if not pool:
        raise NotEnoughQuestionsError("No questions in the bank match those settings yet.")

    rng = rng or random.Random()
    seen_ids = seen_ids or set()

    picked = (
        _mixed_draw(pool, count, seen_ids, rng)
        if (difficulty or MIXED) == MIXED
        else _draw(pool, count, seen_ids, rng)
    )

    paper = []
    for question in picked:
        order = list(range(len(question.get("options") or [])))
        rng.shuffle(order)
        paper.append({"questionId": question["id"], "optionOrder": order})
    return paper


def present_question(question: dict[str, Any], option_order: list[int], number: int) -> dict[str, Any]:
    """Shape one paper entry for the browser - deliberately without the correct answer."""
    options = question.get("options") or []
    return {
        "number": number,
        "questionId": question["id"],
        "category": question.get("category"),
        "topic": question.get("topic"),
        "difficulty": question.get("difficulty"),
        "questionText": question.get("questionText"),
        "options": [options[index] for index in option_order if index < len(options)],
    }


def grade_quiz(
    paper: list[dict[str, Any]],
    questions_by_id: dict[Any, dict[str, Any]],
    answers_by_id: dict[Any, int | None],
) -> list[dict[str, Any]]:
    """Grade every question on the paper, in paper order.

    `answers_by_id` holds the *displayed* option index the candidate picked (or None
    when skipped); it is mapped back through the stored permutation before comparing.
    """
    review = []
    for number, entry in enumerate(paper, start=1):
        question_id = entry["questionId"]
        question = questions_by_id.get(question_id)
        if not question:
            # The question was removed from the bank after this paper was drawn.
            continue

        options = question.get("options") or []
        option_order: list[int] = entry.get("optionOrder") or list(range(len(options)))
        displayed_options = [options[index] for index in option_order if index < len(options)]

        correct_stored_index = question.get("correctOptionIndex")
        correct_index = option_order.index(correct_stored_index) if correct_stored_index in option_order else None

        selected_index = answers_by_id.get(question_id)
        if selected_index is not None and not 0 <= selected_index < len(displayed_options):
            selected_index = None

        review.append(
            {
                "number": number,
                "questionId": question_id,
                "category": question.get("category"),
                "topic": question.get("topic"),
                "difficulty": question.get("difficulty"),
                "questionText": question.get("questionText"),
                "options": displayed_options,
                "selectedIndex": selected_index,
                "correctIndex": correct_index,
                "isCorrect": selected_index is not None and selected_index == correct_index,
                "explanation": question.get("explanation"),
            }
        )
    return review


def summarize_review(review: list[dict[str, Any]]) -> dict[str, Any]:
    """Score, accuracy and per-topic / per-difficulty breakdowns for the result screen."""
    total = len(review)
    score = sum(1 for item in review if item["isCorrect"])
    skipped = sum(1 for item in review if item["selectedIndex"] is None)

    def breakdown(key: str) -> list[dict[str, Any]]:
        buckets: dict[str, dict[str, Any]] = {}
        for item in review:
            name = item.get(key) or "Other"
            bucket = buckets.setdefault(name, {"name": name, "total": 0, "correct": 0})
            bucket["total"] += 1
            bucket["correct"] += 1 if item["isCorrect"] else 0
        for bucket in buckets.values():
            bucket["accuracy"] = round(bucket["correct"] / bucket["total"] * 100)
        # Weakest first: the result screen leads with what to revise.
        return sorted(buckets.values(), key=lambda bucket: bucket["accuracy"])

    return {
        "score": score,
        "totalQuestions": total,
        "skipped": skipped,
        "accuracy": round(score / total * 100) if total else 0,
        "byTopic": breakdown("topic"),
        "byDifficulty": breakdown("difficulty"),
    }


def build_catalog(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Group bank rows into the category -> topics -> per-difficulty counts the UI shows."""
    categories: dict[str, dict[str, Any]] = {}
    for row in rows:
        category = row.get("category") or "Other"
        entry = categories.setdefault(
            category,
            {"category": category, "topics": [], "total": 0, "byDifficulty": {level: 0 for level in DIFFICULTIES}},
        )
        entry["total"] += 1
        topic = row.get("topic")
        if topic and topic not in entry["topics"]:
            entry["topics"].append(topic)
        difficulty = row.get("difficulty")
        if difficulty in entry["byDifficulty"]:
            entry["byDifficulty"][difficulty] += 1

    return {
        "categories": sorted(categories.values(), key=lambda entry: entry["category"]),
        "totalQuestions": len(rows),
        "difficulties": [*DIFFICULTIES, MIXED],
    }
