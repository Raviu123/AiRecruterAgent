import random

import pytest

from app.services.aptitude import (
    NotEnoughQuestionsError,
    build_quiz_paper,
    grade_quiz,
    summarize_review,
)

CATEGORIES = ("Percentages", "Time & Work")
DIFFICULTIES = ("easy", "medium", "hard")


def make_questions(per_bucket: int = 6) -> list[dict]:
    """A miniature bank: every category x difficulty combination, 4 options each."""
    rows = []
    counter = 0
    for category in CATEGORIES:
        for difficulty in DIFFICULTIES:
            for _ in range(per_bucket):
                counter += 1
                rows.append(
                    {
                        # The repository fixture re-stamps `id` with the same value.
                        "id": counter,
                        "external_id": f"test-{counter}",
                        "category": category,
                        "topic": f"{category} topic",
                        "difficulty": difficulty,
                        "questionText": f"Question {counter}?",
                        "options": [f"q{counter}-a", f"q{counter}-b", f"q{counter}-c", f"q{counter}-d"],
                        # Rotate the answer so a quiz that always picks index 0 cannot pass.
                        "correctOptionIndex": counter % 4,
                        "explanation": f"Because {counter}.",
                    }
                )
    return rows


@pytest.fixture
def bank(repo):
    repo.seed_aptitude_questions(make_questions())
    return repo


def start_quiz(client, **overrides):
    payload = {"category": "Percentages", "difficulty": "mixed", "questionCount": 6, **overrides}
    response = client.post("/api/aptitude/quizzes", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def answer_all_correctly(bank, quiz) -> list[dict]:
    """Pick the right displayed option for every question, using the stored paper."""
    paper = {entry["questionId"]: entry["optionOrder"] for entry in bank.get_aptitude_quiz(quiz["quizId"])["questions"]}
    answers = []
    for question in quiz["questions"]:
        stored = next(q for q in bank.aptitude_questions if q["id"] == question["questionId"])
        order = paper[question["questionId"]]
        answers.append(
            {"questionId": question["questionId"], "selectedIndex": order.index(stored["correctOptionIndex"])}
        )
    return answers


# ---- Catalog ---------------------------------------------------------------


def test_catalog_groups_categories_topics_and_counts(client, bank):
    body = client.get("/api/aptitude/catalog").json()

    assert body["totalQuestions"] == 36
    assert [entry["category"] for entry in body["categories"]] == ["Percentages", "Time & Work"]
    percentages = body["categories"][0]
    assert percentages["total"] == 18
    assert percentages["byDifficulty"] == {"easy": 6, "medium": 6, "hard": 6}
    assert percentages["topics"] == ["Percentages topic"]


# ---- Starting a quiz -------------------------------------------------------


def test_start_quiz_returns_requested_count_without_the_answer_key(client, bank):
    quiz = start_quiz(client, questionCount=5)

    assert quiz["totalQuestions"] == 5
    assert len(quiz["questions"]) == 5
    assert quiz["durationSeconds"] == 5 * 60
    for question in quiz["questions"]:
        assert question["category"] == "Percentages"
        assert len(question["options"]) == 4
        assert "correctOptionIndex" not in question
        assert "explanation" not in question


def test_start_quiz_honours_a_difficulty_filter(client, bank):
    quiz = start_quiz(client, difficulty="hard", questionCount=6)

    assert {question["difficulty"] for question in quiz["questions"]} == {"hard"}


def test_mixed_difficulty_spreads_across_levels(client, bank):
    quiz = start_quiz(client, difficulty="mixed", questionCount=6)

    assert len({question["difficulty"] for question in quiz["questions"]}) > 1


def test_repeat_quiz_with_the_same_settings_draws_different_questions(client, bank):
    first = {question["questionId"] for question in start_quiz(client, questionCount=6)["questions"]}
    second = {question["questionId"] for question in start_quiz(client, questionCount=6)["questions"]}

    assert not first & second


def test_draw_falls_back_to_seen_questions_once_the_pool_is_exhausted(client, bank):
    # The Percentages pool holds 18 questions; the fourth 6-question quiz must reuse some.
    drawn = [set(q["questionId"] for q in start_quiz(client, questionCount=6)["questions"]) for _ in range(4)]

    assert len(set().union(*drawn[:3])) == 18
    assert drawn[3] & set().union(*drawn[:3])


def test_start_quiz_404s_when_no_question_matches(client, bank):
    response = client.post(
        "/api/aptitude/quizzes", json={"category": "Nonexistent Category", "questionCount": 5}
    )

    assert response.status_code == 404
    assert "match those settings" in response.json()["detail"]


def test_question_count_is_validated(client, bank):
    assert client.post("/api/aptitude/quizzes", json={"questionCount": 0}).status_code == 422
    assert client.post("/api/aptitude/quizzes", json={"questionCount": 500}).status_code == 422


# ---- Resuming --------------------------------------------------------------


def test_quiz_can_be_reloaded_with_the_same_option_order(client, bank):
    quiz = start_quiz(client)

    reloaded = client.get(f"/api/aptitude/quizzes/{quiz['quizId']}").json()

    assert reloaded["questions"] == quiz["questions"]


def test_another_users_quiz_is_not_readable(client, bank):
    quiz = start_quiz(client)
    bank.get_aptitude_quiz(quiz["quizId"])["userEmail"] = "someone-else@example.com"

    assert client.get(f"/api/aptitude/quizzes/{quiz['quizId']}").status_code == 404


# ---- Grading ---------------------------------------------------------------


def test_submitting_correct_answers_scores_full_marks_and_returns_explanations(client, bank):
    quiz = start_quiz(client, questionCount=5)

    result = client.post(
        f"/api/aptitude/quizzes/{quiz['quizId']}/submit",
        json={"answers": answer_all_correctly(bank, quiz), "timeTakenSeconds": 42},
    ).json()

    assert result["score"] == 5
    assert result["accuracy"] == 100
    assert result["skipped"] == 0
    assert result["timeTakenSeconds"] == 42
    assert all(item["isCorrect"] for item in result["review"])
    assert all(item["explanation"] for item in result["review"])


def test_skipped_questions_count_as_wrong(client, bank):
    quiz = start_quiz(client, questionCount=4)
    answers = answer_all_correctly(bank, quiz)
    answers[0]["selectedIndex"] = None
    answers[1]["selectedIndex"] = (answers[1]["selectedIndex"] + 1) % 4

    result = client.post(
        f"/api/aptitude/quizzes/{quiz['quizId']}/submit", json={"answers": answers}
    ).json()

    assert result["score"] == 2
    assert result["skipped"] == 1
    assert result["accuracy"] == 50
    assert result["review"][0]["selectedIndex"] is None
    assert result["review"][0]["correctIndex"] is not None


def test_submitting_records_an_attempt_and_closes_the_quiz(client, bank):
    quiz = start_quiz(client, questionCount=4)

    client.post(f"/api/aptitude/quizzes/{quiz['quizId']}/submit", json={"answers": []})

    assert bank.get_aptitude_quiz(quiz["quizId"])["status"] == "completed"
    assert len(bank.aptitude_attempts) == 1
    assert bank.aptitude_attempts[0]["userEmail"] == "owner@example.com"


def test_resubmitting_returns_the_stored_attempt_instead_of_regrading(client, bank):
    quiz = start_quiz(client, questionCount=4)
    first = client.post(
        f"/api/aptitude/quizzes/{quiz['quizId']}/submit",
        json={"answers": answer_all_correctly(bank, quiz)},
    ).json()

    second = client.post(f"/api/aptitude/quizzes/{quiz['quizId']}/submit", json={"answers": []}).json()

    assert second["attemptId"] == first["attemptId"]
    assert second["score"] == first["score"]
    assert len(bank.aptitude_attempts) == 1


def test_results_break_down_by_topic_and_difficulty(client, bank):
    quiz = start_quiz(client, questionCount=6)

    result = client.post(
        f"/api/aptitude/quizzes/{quiz['quizId']}/submit",
        json={"answers": answer_all_correctly(bank, quiz)},
    ).json()

    assert [bucket["name"] for bucket in result["byTopic"]] == ["Percentages topic"]
    assert result["byTopic"][0]["accuracy"] == 100
    assert sum(bucket["total"] for bucket in result["byDifficulty"]) == 6


# ---- History ---------------------------------------------------------------


def test_attempt_history_lists_newest_first_and_serves_a_stored_review(client, bank):
    for count in (4, 5):
        quiz = start_quiz(client, questionCount=count)
        client.post(f"/api/aptitude/quizzes/{quiz['quizId']}/submit", json={"answers": []})

    history = client.get("/api/aptitude/attempts").json()
    assert [attempt["totalQuestions"] for attempt in history] == [5, 4]

    detail = client.get(f"/api/aptitude/attempts/{history[0]['id']}").json()
    assert len(detail["review"]) == 5
    assert detail["score"] == 0


def test_another_users_attempt_is_not_readable(client, bank):
    quiz = start_quiz(client, questionCount=4)
    client.post(f"/api/aptitude/quizzes/{quiz['quizId']}/submit", json={"answers": []})
    bank.aptitude_attempts[0]["userEmail"] = "someone-else@example.com"

    assert client.get("/api/aptitude/attempts/1").status_code == 404


def test_aptitude_endpoints_require_a_signed_in_user(anonymous_client):
    assert anonymous_client.get("/api/aptitude/catalog").status_code == 401
    assert anonymous_client.post("/api/aptitude/quizzes", json={}).status_code == 401
    assert anonymous_client.get("/api/aptitude/attempts").status_code == 401


# ---- Draw and grading internals -------------------------------------------


def test_build_quiz_paper_shuffles_options_per_question():
    questions = make_questions()
    paper = build_quiz_paper(questions, 12, "mixed", rng=random.Random(7))

    assert len(paper) == 12
    assert len({entry["questionId"] for entry in paper}) == 12
    assert all(sorted(entry["optionOrder"]) == [0, 1, 2, 3] for entry in paper)
    # With 12 shuffles the chance of every option order staying identity is negligible.
    assert any(entry["optionOrder"] != [0, 1, 2, 3] for entry in paper)


def test_build_quiz_paper_prefers_unseen_questions():
    questions = make_questions()
    seen = {question["id"] for question in questions[:30]}

    paper = build_quiz_paper(questions, 6, "mixed", seen_ids=seen, rng=random.Random(3))

    assert not {entry["questionId"] for entry in paper} & seen


def test_build_quiz_paper_rejects_an_empty_pool():
    with pytest.raises(NotEnoughQuestionsError):
        build_quiz_paper([], 5)


def test_grade_quiz_maps_answers_back_through_the_shuffle():
    question = {
        "id": 1,
        "category": "Percentages",
        "topic": "t",
        "difficulty": "easy",
        "questionText": "?",
        "options": ["w", "x", "y", "z"],
        "correctOptionIndex": 2,  # "y"
        "explanation": "because",
    }
    paper = [{"questionId": 1, "optionOrder": [3, 2, 0, 1]}]  # displayed: z, y, w, x

    review = grade_quiz(paper, {1: question}, {1: 1})

    assert review[0]["options"] == ["z", "y", "w", "x"]
    assert review[0]["correctIndex"] == 1
    assert review[0]["isCorrect"] is True
    assert grade_quiz(paper, {1: question}, {1: 0})[0]["isCorrect"] is False


def test_grade_quiz_drops_questions_removed_from_the_bank():
    paper = [{"questionId": 1, "optionOrder": [0, 1]}, {"questionId": 2, "optionOrder": [0, 1]}]
    question = {"id": 1, "options": ["a", "b"], "correctOptionIndex": 0, "questionText": "?"}

    review = grade_quiz(paper, {1: question}, {1: 0})

    assert [item["questionId"] for item in review] == [1]


def test_summarize_review_of_an_empty_paper_does_not_divide_by_zero():
    assert summarize_review([]) == {
        "score": 0,
        "totalQuestions": 0,
        "skipped": 0,
        "accuracy": 0,
        "byTopic": [],
        "byDifficulty": [],
    }
