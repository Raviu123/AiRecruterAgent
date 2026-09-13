import { supabase } from "@/services/supabaseClient";

/**
 * Analytics Module - Aggregates Candidate Performance across Mock Interviews and Aptitude Quizzes
 */

export async function fetchCandidateAnalyticsSummary(userEmail) {
  try {
    const { data: interviews } = await supabase
      .from('Interviews')
      .select('*')
      .eq('userEmail', userEmail);

    const { data: aptitudeAttempts } = await supabase
      .from('aptitude_attempts')
      .select('*')
      .eq('userEmail', userEmail);

    const totalMockInterviews = interviews?.length || 0;
    const totalAptitudeQuizzes = aptitudeAttempts?.length || 0;

    const avgAptitudeAccuracy = totalAptitudeQuizzes > 0
      ? Math.round(aptitudeAttempts.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalAptitudeQuizzes)
      : 0;

    return {
      totalMockInterviews,
      totalAptitudeQuizzes,
      avgAptitudeAccuracy,
      recentInterviews: interviews?.slice(0, 5) || [],
      recentQuizzes: aptitudeAttempts?.slice(0, 5) || []
    };
  } catch (err) {
    console.error("Error fetching analytics summary:", err);
    return {
      totalMockInterviews: 0,
      totalAptitudeQuizzes: 0,
      avgAptitudeAccuracy: 0,
      recentInterviews: [],
      recentQuizzes: []
    };
  }
}
