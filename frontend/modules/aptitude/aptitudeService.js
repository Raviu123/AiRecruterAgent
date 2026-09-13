import { apiRequest } from "@/services/apiClient";

/**
 * Aptitude Module - Handles Question Bank Queries, Test Generation, and Quiz Evaluation
 */

export const APTITUDE_CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Interpretation"
];

export const APTITUDE_TOPICS = {
  "Quantitative Aptitude": ["Time & Work", "Speed & Distance", "Percentages", "Profit & Loss", "Permutation & Combination"],
  "Logical Reasoning": ["Syllogism", "Blood Relations", "Coding-Decoding", "Seating Arrangement", "Series"],
  "Verbal Ability": ["Reading Comprehension", "Synonyms & Antonyms", "Sentence Correction", "Para Jumbles"],
  "Data Interpretation": ["Bar Charts", "Pie Charts", "Tables", "Line Graphs"]
};

export async function fetchAptitudeQuestions({ category, difficulty, limit = 10 }) {
  try {
    return await apiRequest('/api/aptitude/questions', { query: { category, difficulty, limit } });
  } catch (err) {
    console.error("Error fetching aptitude questions:", err);
    return [];
  }
}

/**
 * Store a finished quiz for the signed-in user (identity comes from the session token).
 */
export function submitAptitudeAttempt({ quizConfig, score, totalQuestions, userAnswers }) {
  return apiRequest('/api/aptitude/attempts', {
    method: 'POST',
    body: {
      category: quizConfig.category,
      difficulty: quizConfig.difficulty,
      score,
      totalQuestions,
      userAnswers
    }
  });
}
