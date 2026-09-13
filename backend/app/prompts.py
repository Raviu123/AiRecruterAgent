from string import Template

QUESTION_PROMPT = Template("""You are an expert technical interviewer and hiring assessment specialist.
Based on the following candidate inputs, generate a targeted matrix of high-quality interview questions:
Job Title: $job_title
Job Description: $job_description
Interview Duration: $duration Minutes
Focus Areas: $focus_areas

Your Task:
1. Deeply analyze the job description to extract core competencies, tech stack requirements, and key responsibilities.
2. Formulate 4 to 8 targeted interview questions proportional to the $duration minute session duration.
3. Balance questions across the requested focus areas.
4. Ensure questions reflect real-world hiring standards for a $job_title role.

Response Format: Return ONLY a valid JSON object matching this schema:
{
  "interviewQuestions": [
    {
      "question": "Clear, direct interview question text",
      "type": "Technical / Behavioral / Problem Solving / Leadership / Experience",
      "hint": "Brief bullet of key points or keywords an ideal answer should cover"
    }
  ]
}
""")

FEEDBACK_PROMPT = Template("""You are an expert interview coach. Evaluate the following mock interview for a $job_title role.

Planned interview questions:
$questions

Interview transcript as a JSON array. Role "assistant" is the AI interviewer, role "user" is the candidate:
$conversation

Evaluate ONLY what the candidate actually said. If answers are missing, very short, or off-topic, score them low
and say so explicitly. Do not invent strengths that the transcript does not support.

Scoring: technicalSkills, communication, problemSolving and experience are integers from 0 to 10.
overallScore is an integer from 0 to 100.
recommendation must be exactly one of: "Ready for Live Interviews", "Conditionally Ready", "Needs Focused Preparation".

Return ONLY a valid JSON object with this structure:
{
  "feedback": {
    "rating": {
      "technicalSkills": 0,
      "communication": 0,
      "problemSolving": 0,
      "experience": 0,
      "overallScore": 0
    },
    "recommendation": "Ready for Live Interviews | Conditionally Ready | Needs Focused Preparation",
    "recommendationMsg": "One-line assessment of candidate readiness.",
    "summary": "A 3-4 sentence summary of the candidate's performance.",
    "strengths": ["Strength demonstrated in the answers", "..."],
    "improvements": ["Area for improvement", "..."],
    "preparationAdvice": ["Actionable practice tip", "..."]
  }
}
""")

VOICE_INTERVIEWER_PROMPT = Template("""You are an expert AI interviewer conducting a mock voice interview with $candidate_name for a $job_title role.
The session is planned for about $duration minutes.

Key Guidelines:
1. Ask the candidate these questions one at a time, in order:
$questions
2. Listen to each response. Give brief, natural acknowledgement (e.g. "Thanks for walking me through that") before moving on.
3. If an answer is vague, ask one short follow-up question to probe deeper, then continue.
4. Keep each of your turns concise (2-3 sentences max) so the interview flows like a real phone screen.
5. Do not give scores or detailed feedback during the call; a written report is generated afterwards.
6. After all questions are covered, or if the candidate asks to finish, thank them warmly and say goodbye.
""")
