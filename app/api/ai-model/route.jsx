import OpenAI from "openai"
import { NextResponse } from "next/server" 
import { QUESTION_PROMPT } from "@/services/Constants"

export async function POST(req) {
  try {
    const { jobposition, jobdescription, interviewduration, type } = await req.json()

    const FINAL_PROMPT = QUESTION_PROMPT
      .replace('{{jobTitle}}', jobposition || 'Software Engineer')
      .replace('{{jobDescription}}', jobdescription || 'Technical role')
      .replace('{{duration}}', interviewduration || '15')
      .replace('{{type}}', Array.isArray(type) ? type.join(', ') : type || 'Technical')

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("No OpenAI/OpenRouter API key set. Returning fallback mock questions.");
      return NextResponse.json({
        content: JSON.stringify({
          interviewQuestions: [
            { question: `Tell me about your background as a ${jobposition || 'developer'} and your core technical skills.`, type: "Technical" },
            { question: `Describe a challenging problem you solved in your recent project related to ${jobposition || 'your field'}.`, type: "Problem Solving" },
            { question: "How do you handle tight deadlines or shifting requirements in a team environment?", type: "Behavioral" }
          ]
        })
      });
    }

    const openai = new OpenAI({
      baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
      apiKey: apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_API_KEY ? "google/gemini-2.0-flash-exp:free" : "gpt-4o-mini",  
      messages: [
        { role: "user", content: FINAL_PROMPT } 
      ],
      response_format: { type: 'json_object' }
    })

    return NextResponse.json(completion.choices[0].message)
  } catch (e) {
    console.error("Error in ai-model route:", e)
    return NextResponse.json({
      content: JSON.stringify({
        interviewQuestions: [
          { question: "Tell me about your technical background and experience.", type: "Technical" },
          { question: "Describe a complex technical issue you recently debugged.", type: "Problem Solving" },
          { question: "How do you prioritize tasks when working on multiple features?", type: "Behavioral" }
        ]
      })
    })
  }
}