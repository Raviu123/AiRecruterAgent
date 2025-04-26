import OpenAI from "openai"
import { NextResponse } from "next/server" 
import { QUESTION_PROMPT } from "@/services/Constants"
//Nextresponse is a built-in object in Next.js that allows you to create HTTP responses in API routes and middleware. It provides methods to set the response status, headers, and body, making it easier to handle server-side logic and return data to the client.
export async function POST(req) {

//we are getting the data from the request body and destructuring it to get the values of jobposition, jobdescription, interviewduration, and type.
    const { jobposition, jobdescription, interviewduration, type } = await req.json()

//we have a prompt,(its in constants file) it has the {{jobTitle}}, {{jobDescription}}, {{duration}}, and {{type}} placeholders, which we are replacing with the values we got from the request body.
    const FINAL_PROMPT = QUESTION_PROMPT.replace('{{jobTitle}}',jobposition)
.replace('{{jobDescription}}',jobdescription)
.replace('{{duration}}',interviewduration)
.replace('{{type}}',type)

console.log("Final Prompt",FINAL_PROMPT)

try{
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  
})

const completion = await openai.chat.completions.create({
    model: "google/gemini-2.0-flash-exp:free",  
    messages: [
      { role: "user", content: FINAL_PROMPT } 
    ],
    response_format: 'json'
  })

  console.log(completion.choices[0].message)
  return NextResponse.json(completion.choices[0].message)
}
catch(e){
    console.log(e)
    return NextResponse.json(e)
}
}