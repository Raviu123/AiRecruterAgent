/**
 * Core Data Contracts for AI Interview Preparation Platform
 */

/**
 * @typedef {Object} MockInterviewConfig
 * @property {string} id
 * @property {string} jobTitle
 * @property {string} jobDescription
 * @property {number} duration
 * @property {string[]} types
 * @property {Array<{question: string, type: string}>} questions
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AptitudeQuestion
 * @property {string} id
 * @property {string} category - Quantitative | Logical | Verbal | Data Interpretation
 * @property {string} topic - e.g. "Time & Work", "Syllogism", "Pointers"
 * @property {'easy' | 'medium' | 'hard'} difficulty
 * @property {string} questionText
 * @property {string[]} options
 * @property {number} correctOptionIndex
 * @property {string} explanation
 */

/**
 * @typedef {Object} AptitudeQuizConfig
 * @property {string[]} categories
 * @property {string[]} topics
 * @property {'easy' | 'medium' | 'hard' | 'mixed'} difficulty
 * @property {number} questionCount
 * @property {number} timeLimitMinutes
 */

/**
 * @typedef {Object} CandidateFeedback
 * @property {string} id
 * @property {string} interviewId
 * @property {{ technicalSkills: number, communication: number, problemSolving: number, experience: number }} ratings
 * @property {string} summary
 * @property {string} recommendation
 * @property {string} createdAt
 */
