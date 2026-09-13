import { supabase } from "@/services/supabaseClient";
import { QUESTION_PROMPT, FEEDBACK_PROMPT } from "@/services/Constants";

/**
 * Mock Interview Module - Handles JD parsing, Question Generation, and Interview Persistence
 */
export async function createCandidateMockInterview({ jobTitle, jobDescription, duration, type, userEmail }) {
  try {
    const response = await fetch('/api/ai-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: QUESTION_PROMPT
          .replace('{{jobTitle}}', jobTitle)
          .replace('{{jobDescription}}', jobDescription)
          .replace('{{duration}}', duration)
          .replace('{{type}}', type)
      })
    });

    const data = await response.json();
    const questions = data.result || [];

    const { data: interviewData, error } = await supabase
      .from('Interviews')
      .insert([
        {
          jobTitle,
          jobDescription,
          duration,
          type,
          questions,
          userEmail,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return interviewData?.[0];
  } catch (err) {
    console.error("Error creating candidate mock interview:", err);
    throw err;
  }
}

export async function fetchUserMockInterviews(userEmail) {
  const { data, error } = await supabase
    .from('Interviews')
    .select('*')
    .eq('userEmail', userEmail)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching mock interviews:", error);
    return [];
  }
  return data;
}
