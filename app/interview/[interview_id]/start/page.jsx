"use client"
import React, { useContext, useState, useEffect } from 'react'
import InterviewDataContext from '@/context/interviewDataContext'
import { Timer, Mic, Phone, Volume2 } from 'lucide-react'
import Image from 'next/image'
import Vapi from "@vapi-ai/web"
import AlertConfiirmation from './_components/AlertConfiirmation'
import axios from 'axios'
import { supabase } from '@/services/supabaseClient'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // Add this import for toast

const StartInterview = () => {
  
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
  const [activeUser, setActiveUser] = useState(false)
  const [conversation, setConversation] = useState()
  const [volume, setVolume] = useState(100) // Add volume state
  const [isCallActive, setIsCallActive] = useState(false) // Track call status
  const { interview_id } = useParams()
  const router = useRouter()

  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)

  useEffect(() => {
    interviewInfo && startCall()
    
    // Add cleanup function to ensure call ends when component unmounts
    return () => {
      if (isCallActive) {
        vapi.stop()
      }
    }
  }, [interviewInfo])

  // Add volume change handler
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value
    setVolume(newVolume)
    
    // Set audio volume for Vapi if it has this capability
    if (vapi.setVolume) {
      vapi.setVolume(newVolume / 100)
    }
    
    // Also set volume for any audio elements on the page
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100
    })
  }

  const startCall = () => {
    let questionList = ""
    if (interviewInfo) {
      interviewInfo?.interviewData?.questionList.forEach((item) => {
        questionList = item?.question + ', ' + questionList
      })
    }

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: "Hi " + interviewInfo?.userName + ", how are you? Ready for your interview on " + interviewInfo?.interviewData?.jobPosition + "?",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ${interviewInfo?.interviewData?.jobPosition} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ${questionList}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
          },
        ],
      },
    }
  
    try {
      vapi.start(assistantOptions)
      setIsCallActive(true)
      console.log('Interview started')
    } catch (error) {
      console.error('Failed to start interview:', error)
      toast.error('Failed to start interview')
    }
  }

  const stopInterview = () => {
    if (isCallActive) {
      try {
        vapi.stop()
        setIsCallActive(false)
        toast.success('Interview stopped')
        // Only generate feedback if we have conversation data
        if (conversation) {
          generateFeedback()
        } else {
          toast.error('No conversation data available for feedback')
          router.replace('/interview/' + interview_id + '/completed')
        }
      } catch (error) {
        console.error('Error stopping interview:', error)
        toast.error('Error stopping interview')
      }
    }
  }

  // Set up event listeners
  useEffect(() => {
    const setupEventListeners = () => {
      vapi.on("call-start", () => {
        console.log("Call has started.")
        toast.success("Call Connected...")
        setIsCallActive(true)
      })
      
      vapi.on("speech-start", () => {
        console.log("Assistant speech has started.")
        setActiveUser(false)
      })
      
      vapi.on("speech-end", () => {
        console.log("Assistant speech has ended.")
        setActiveUser(true)
      })
      
      vapi.on("call-end", () => {
        console.log("Call has ended.")
        toast.success('Interview Ended')
        setIsCallActive(false)
        if (conversation) {
          generateFeedback()
        }
      })
      
      // Various assistant messages can come back (like function calls, transcripts, etc)
      vapi.on("message", (message) => {
        console.log(message?.conversation)
        setConversation(message?.conversation)
      })

      vapi.on("error", (error) => {
        console.error("Vapi error:", error)
        toast.error("Error during interview session")
        setIsCallActive(false)
      })
    }

    setupEventListeners()
    
    // Clean up event listeners when component unmounts
    return () => {
      vapi.removeAllListeners()
    }
  }, [])

  const generateFeedback = async () => {
    try {
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversation
      })
  
      console.log(result?.data)
      const content = result.data.content
      const finalContent = content.replace('```json','').replace('```','')
  
      console.log(finalContent)
      
      // Parse JSON properly
      let parsedFeedback
      try {
        parsedFeedback = JSON.parse(finalContent)
      } catch (error) {
        console.error("Error parsing feedback JSON:", error)
        toast.error("Error processing interview feedback")
        router.replace('/interview/' + interview_id + '/completed')
        return
      }
  
      // Save to database
      const { data, error } = await supabase
        .from('interview-feedback')
        .insert([
          { 
            userName: interviewInfo?.userName,
            userEmail: interviewInfo?.userEmail,
            interview_id: interview_id,
            feedback: parsedFeedback,
            recommendation: false
          }
        ])
        .select()
      
      if (error) {
        console.error("Error saving feedback to database:", error)
        toast.error("Failed to save interview feedback")
      } else {
        console.log("Data saved to supabase:", data)
        toast.success("Interview feedback saved")
      }
  
      router.replace('/interview/' + interview_id + '/completed')
    } catch (error) {
      console.error("Error in generateFeedback:", error)
      toast.error("Failed to generate feedback")
      router.replace('/interview/' + interview_id + '/completed')
    }
  }

  return (
    <div className='p-8 lg:px-48 xl:px-56 bg-gray-200'>
      <h2 className='font-bold text-xl flex justify-between'>AI Interview Session
        <span className='flex gap-2 items-center'>
          <Timer />00:00:00
        </span>
      </h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
        <div className='bg-white h-[400px] p-20 rounded-lg border flex flex-col gap-3 items-center justify-center'>
          <div className='relative'>
            {activeUser === false && (
              <span className='absolute inset-0 rounded-full bg-blue-500/50 opacity-75 animate-ping duration-1000'/>
            )}
            <Image 
              src={'/ai.jpg'} 
              alt="interviewer" 
              width={100} 
              height={100} 
              className='w-[60px] h-[60px] rounded-full object-center relative z-10'
            />
          </div>
          <h2>AI Recruiter</h2>
        </div>

        <div className='bg-white h-[400px] p-20 rounded-lg border items-center justify-center flex flex-col gap-3'>
          <div className='relative'>
            {activeUser === true && (
              <span className='absolute inset-0 rounded-full bg-blue-500/50 opacity-75 animate-ping duration-1000'/>
            )}
            <h2 className='text-2xl bg-primary text-white p-5 rounded-full px-7 relative z-10'>
              {interviewInfo?.userName?.[0] || "?"}
            </h2>
          </div>
          <h2>{interviewInfo?.userName}</h2>
        </div>
      </div>

      {/* Volume slider */}
      <div className='flex items-center justify-center gap-3 mt-8 mb-4'>
        <Volume2 className='text-gray-600' />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume} 
          onChange={handleVolumeChange}
          className='w-40 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer'
        />
        <span className='text-sm text-gray-600'>{volume}%</span>
      </div>

      <div className='flex items-center justify-center gap-5 mt-4'>
        <Mic className={`text-white h-10 w-10 p-3 ${activeUser ? 'bg-green-500' : 'bg-gray-500'} cursor-pointer rounded-full`} />
        
        <AlertConfiirmation stopInterview={stopInterview}>
          <Phone className='text-white h-10 w-10 p-3 bg-red-500 cursor-pointer rounded-full' />
        </AlertConfiirmation>
      </div>
      
      <h2 className='text-sm text-gray-400 text-center mt-5'>
        {isCallActive ? 'Interview in Progress....' : 'Interview not active'}
      </h2>
    </div>
  )
}

export default StartInterview