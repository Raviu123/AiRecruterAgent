import { apiRequest } from "@/services/apiClient";

/**
 * Analytics Module - Aggregates Candidate Performance across Mock Interviews and Aptitude Quizzes
 */

export const EMPTY_ANALYTICS_SUMMARY = {
  totalMockInterviews: 0,
  completedMockSessions: 0,
  avgInterviewScore: 0,
  totalAptitudeQuizzes: 0,
  avgAptitudeAccuracy: 0,
  recentInterviews: [],
  recentQuizzes: []
};

export function fetchCandidateAnalyticsSummary() {
  return apiRequest('/api/analytics/summary');
}
