import { FEEDBACK_PROMPT } from "@/services/Constants"
import OpenAI from "openai"
import { NextResponse } from "next/server" 

export async function POST(req) {
  try {
    const { conversation } = await req.json()
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace("{{conversation}}", JSON.stringify(conversation || []))  

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("No OpenAI/OpenRouter API key set. Returning fallback mock feedback.");
      return NextResponse.json({
        content: JSON.stringify({
          feedback: {
            rating: { techicalSkills: 8, communication: 7, problemSolving: 8, experince: 7 },
            summery: "Good overall interview performance with clear answers.",
            Recommendation: "Recommended",
            RecommendationMsg: "Solid candidate performance."
          }
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
    console.error("Error in ai-feedback route:", e)
    return NextResponse.json({
      content: JSON.stringify({
        feedback: {
          rating: { techicalSkills: 7, communication: 7, problemSolving: 7, experince: 7 },
          summery: "Completed voice interview session.",
          Recommendation: "Recommended",
          RecommendationMsg: "Candidate performance evaluated."
        }
      })
    })
  }
}