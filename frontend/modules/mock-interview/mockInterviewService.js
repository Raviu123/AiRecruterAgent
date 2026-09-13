import { apiRequest } from "@/services/apiClient";

/**
 * Mock Interview Module - thin client over the FastAPI backend.
 * Question generation, persistence, Vapi assistant config and feedback grading all run server-side.
 */

/**
 * Shareable link to the candidate lobby of an interview.
 */
export function getInterviewShareUrl(interviewId) {
  const origin = process.env.NEXT_PUBLIC_HOST_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/interview/${interviewId}`;
}

/**
 * Generate interview questions for a JD.
 * @returns {Promise<{questions: Array<{question: string, type: string, hint?: string}>, source: 'ai'|'fallback', warning?: string}>}
 */
export function generateQuestionsFromJD({ jobposition, jobdescription, interviewduration, type }) {
  return apiRequest('/api/interviews/generate-questions', {
    method: 'POST',
    body: { jobposition, jobdescription, interviewduration, type },
  });
}

/**
 * Save an interview for the signed-in user. The backend assigns `interview_id`.
 */
export function createInterview({ jobposition, jobdescription, interviewduration, type, questionList }) {
  return apiRequest('/api/interviews', {
    method: 'POST',
    body: { jobposition, jobdescription, interviewduration, type, questionList },
  });
}

/**
 * Interviews created by the signed-in user, newest first, each with `interview-feedback` attempts.
 */
export function fetchUserInterviews({ limit } = {}) {
  return apiRequest('/api/interviews', { query: { limit } });
}

/**
 * Public interview data for the candidate lobby / interview room.
 */
export function getInterview(interviewId) {
  return apiRequest(`/api/interviews/${interviewId}`);
}

/**
 * Owner-only interview details including all candidate reports.
 */
export function getInterviewDetails(interviewId) {
  return apiRequest(`/api/interviews/${interviewId}/details`);
}

/**
 * Vapi assistant configuration to pass to `vapi.start()`.
 */
export function getAssistantConfig(interviewId, userName) {
  return apiRequest(`/api/interviews/${interviewId}/assistant-config`, { query: { user_name: userName } });
}

/**
 * Grade a finished attempt and store the report.
 * @param {{userName: string, userEmail?: string, conversation: Array<{role: 'assistant'|'user', content: string}>, mode: 'voice'|'text'}} attempt
 */
export function submitInterviewFeedback(interviewId, attempt) {
  return apiRequest(`/api/interviews/${interviewId}/feedback`, { method: 'POST', body: attempt });
}

export function fetchInterviewFeedback(interviewId, feedbackId) {
  return apiRequest(`/api/interviews/${interviewId}/feedback/${feedbackId}`);
}
