from app.llm import LLMResponseError, parse_json_content
from tests.conftest import OWNER, not_configured

import pytest

SETUP = {
    "jobposition": "Backend Engineer",
    "jobdescription": "Build Python APIs with FastAPI and Postgres.",
    "interviewduration": 15,
    "type": ["Technical", "Behavioral"],
}

QUESTIONS = [
    {"question": "How would you design a rate limiter?", "type": "Technical", "hint": "Token bucket"},
    {"question": "Tell me about a conflict you resolved.", "type": "Behavioral"},
]

REPORT = {
    "feedback": {
        "rating": {
            "technicalSkills": 8.4,
            "communication": 7,
            "problemSolving": "6",
            "experience": 12,
            "overallScore": 74,
        },
        "recommendation": "conditionally ready",
        "recommendationMsg": "Good fundamentals.",
        "summary": "Solid answers.",
        "strengths": ["Clear design reasoning"],
        "improvements": ["More metrics"],
        "preparationAdvice": ["Practice STAR"],
    }
}


def create_interview(client):
    response = client.post("/api/interviews", json={**SETUP, "questionList": QUESTIONS})
    assert response.status_code == 201, response.text
    return response.json()


def test_generate_questions_uses_ai(client, llm):
    llm.responses.append({"interviewQuestions": QUESTIONS})

    response = client.post("/api/interviews/generate-questions", json=SETUP)

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "ai"
    assert [q["question"] for q in body["questions"]] == [q["question"] for q in QUESTIONS]
    assert "Backend Engineer" in llm.prompts[0]
    assert "Technical, Behavioral" in llm.prompts[0]


def test_generate_questions_falls_back_when_ai_unavailable(client, llm):
    llm.responses.append(not_configured())

    body = client.post("/api/interviews/generate-questions", json=SETUP).json()

    assert body["source"] == "fallback"
    assert len(body["questions"]) >= 3
    assert body["warning"]


def test_generate_questions_rejects_empty_job_title(client):
    response = client.post("/api/interviews/generate-questions", json={**SETUP, "jobposition": "  "})
    assert response.status_code == 422


def test_owner_endpoints_require_auth(anonymous_client):
    assert anonymous_client.post("/api/interviews", json={**SETUP, "questionList": QUESTIONS}).status_code == 401
    assert anonymous_client.get("/api/interviews").status_code == 401


def test_create_and_list_interviews_are_scoped_to_owner(client, repo):
    created = create_interview(client)

    assert created["userEmail"] == OWNER.email
    assert created["type"] == "Technical, Behavioral"
    assert created["interviewduration"] == "15"

    repo.create_interview({**created, "interview_id": "someone-else", "userEmail": "other@example.com"})
    listed = client.get("/api/interviews").json()
    assert [i["interview_id"] for i in listed] == [created["interview_id"]]


def test_public_interview_hides_owner_email(anonymous_client, client):
    created = create_interview(client)

    response = anonymous_client.get(f"/api/interviews/{created['interview_id']}")

    assert response.status_code == 200
    assert "userEmail" not in response.json()
    assert response.json()["questionList"][0]["question"] == QUESTIONS[0]["question"]


def test_unknown_interview_returns_404(anonymous_client):
    response = anonymous_client.get("/api/interviews/3f0b8f5e-8a57-4a50-9d8b-4a3c1b7ad111")
    assert response.status_code == 404


def test_assistant_config_contains_questions(client):
    created = create_interview(client)

    config = client.get(
        f"/api/interviews/{created['interview_id']}/assistant-config", params={"user_name": "Asha"}
    ).json()

    system_prompt = config["model"]["messages"][0]["content"]
    assert "Asha" in config["firstMessage"]
    assert "1. How would you design a rate limiter?" in system_prompt
    assert config["maxDurationSeconds"] == 20 * 60


def test_submit_feedback_stores_normalized_report(client, llm):
    created = create_interview(client)
    llm.responses.append(REPORT)

    response = client.post(
        f"/api/interviews/{created['interview_id']}/feedback",
        json={
            "userName": "Asha",
            "userEmail": "asha@example.com",
            "mode": "text",
            "conversation": [
                {"role": "system", "content": "hidden system prompt"},
                {"role": "assistant", "content": QUESTIONS[0]["question"]},
                {"role": "user", "content": "I would use a token bucket in Redis."},
                {"role": "user", "content": "   "},
            ],
        },
    )

    assert response.status_code == 201, response.text
    row = response.json()
    rating = row["feedback"]["feedback"]["rating"]
    assert rating == {
        "technicalSkills": 8,
        "communication": 7,
        "problemSolving": 6,
        "experience": 10,
        "overallScore": 74,
    }
    assert row["feedback"]["feedback"]["recommendation"] == "Conditionally Ready"
    assert row["recommendation"] is False
    assert row["feedback"]["transcript"] == [
        {"role": "assistant", "content": QUESTIONS[0]["question"]},
        {"role": "user", "content": "I would use a token bucket in Redis."},
    ]
    assert "hidden system prompt" not in llm.prompts[0]

    fetched = client.get(f"/api/interviews/{created['interview_id']}/feedback/{row['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == row["id"]

    details = client.get(f"/api/interviews/{created['interview_id']}/details").json()
    assert details["interview-feedback"][0]["userName"] == "Asha"


def test_submit_feedback_without_answers_is_rejected(client, llm):
    created = create_interview(client)

    response = client.post(
        f"/api/interviews/{created['interview_id']}/feedback",
        json={"userName": "Asha", "conversation": [{"role": "assistant", "content": "Hello"}]},
    )

    assert response.status_code == 400
    assert llm.prompts == []


@pytest.mark.parametrize(
    ("error", "expected_status"),
    [(not_configured(), 503), (LLMResponseError("bad output"), 502), ({"feedback": {"summary": "x"}}, 502)],
)
def test_submit_feedback_surfaces_ai_failures(client, llm, repo, error, expected_status):
    created = create_interview(client)
    llm.responses.append(error)

    response = client.post(
        f"/api/interviews/{created['interview_id']}/feedback",
        json={"userName": "Asha", "conversation": [{"role": "user", "content": "My answer"}]},
    )

    assert response.status_code == expected_status
    assert repo.feedback == []


def test_analytics_summary(client, llm):
    created = create_interview(client)
    llm.responses.append(REPORT)
    client.post(
        f"/api/interviews/{created['interview_id']}/feedback",
        json={"userName": "Asha", "conversation": [{"role": "user", "content": "My answer"}]},
    )

    summary = client.get("/api/analytics/summary").json()

    assert summary["totalMockInterviews"] == 1
    assert summary["completedMockSessions"] == 1
    assert summary["avgInterviewScore"] == 74


def test_sync_user_creates_once(client, repo):
    first = client.post("/api/users/me").json()
    second = client.post("/api/users/me").json()

    assert first["email"] == OWNER.email
    assert first["id"] == second["id"]
    assert len(repo.users) == 1


@pytest.mark.parametrize(
    "content",
    ['{"a": 1}', '```json\n{"a": 1}\n```', '```\n{"a": 1}```'],
)
def test_parse_json_content_strips_fences(content):
    assert parse_json_content(content) == {"a": 1}


def test_parse_json_content_rejects_non_objects():
    with pytest.raises(LLMResponseError):
        parse_json_content("[1, 2]")
