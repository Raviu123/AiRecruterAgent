"use client"
import React, { useContext, useState, useEffect, useRef } from 'react'
import InterviewDataContext from '@/context/interviewDataContext'
import { Timer, Mic, Phone, Volume2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Vapi from "@vapi-ai/web"
import AlertConfiirmation from './_components/AlertConfiirmation'
import axios from 'axios'
import { supabase } from '@/services/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

const StartInterview = () => {
  
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
  const [activeUser, setActiveUser] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [volume, setVolume] = useState(100)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isFeedbackGenerating, setIsFeedbackGenerating] = useState(false)
  const { interview_id } = useParams()
  const router = useRouter()
  
  // Use ref to maintain stable reference to vapi instance
  const vapiRef = useRef(null)
  
  // Initialize Vapi once
  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
    }
    
    // Clean up function
    return () => {
      if (vapiRef.current) {
        try {
          if (isCallActive) {
            vapiRef.current.stop()
          }
          vapiRef.current.removeAllListeners()
        } catch (error) {
          console.error('Error during cleanup:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (interviewInfo && vapiRef.current) {
      setupEventListeners()
      startCall()
    }
  }, [interviewInfo])

  // Set up event listeners
  const setupEventListeners = () => {
    if (!vapiRef.current) return
    
    vapiRef.current.on("call-start", () => {
      console.log("Call has started.")
      toast.success("Call Connected...")
      setIsCallActive(true)
    })
    
    vapiRef.current.on("speech-start", () => {
      console.log("Assistant speech has started.")
      setActiveUser(false)
    })
    
    vapiRef.current.on("speech-end", () => {
      console.log("Assistant speech has ended.")
      setActiveUser(true)
    })
    
    vapiRef.current.on("call-end", () => {
      console.log("Call has ended.")
      toast.success('Interview Ended')
      setIsCallActive(false)
      
      // Instead of using a timeout that could race with other triggers
      if (!isFeedbackGenerating) {
        setIsFeedbackGenerating(true) // Set the flag immediately
        generateFeedback()
      }
    })
    
    // Various assistant messages can come back (like function calls, transcripts, etc)
    vapiRef.current.on("message", (message) => {
      if (message?.conversation) {
        console.log("Received conversation update")
        setConversation(message.conversation)
      }
    })

    vapiRef.current.on("error", (error) => {
      console.log("Vapi error:", error)
      toast.error("Error during interview session")
      setIsCallActive(false)
      setIsEnding(false)
    })
  }

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    
    // Set audio volume for Vapi if it has this capability
    if (vapiRef.current?.setVolume) {
      vapiRef.current.setVolume(newVolume / 100)
    }
    
    // Also set volume for any audio elements on the page
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100
    })
  }

  const startCall = () => {
    if (!vapiRef.current || !interviewInfo) return
    
    let questionList = ""
    if (interviewInfo?.interviewData?.questionList) {
      interviewInfo.interviewData.questionList.forEach((item) => {
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
      vapiRef.current.start(assistantOptions)
      setIsCallActive(true)
      console.log('Interview started')
    } catch (error) {
      console.error('Failed to start interview:', error)
      toast.error('Failed to start interview')
    }
  }

  const stopInterview = async () => {
    // Prevent multiple stop attempts or feedback generation attempts
    if (isEnding || isFeedbackGenerating) return
    
    setIsEnding(true)
    toast.loading("Ending interview...", { id: "ending-interview" })
    
    if (vapiRef.current && isCallActive) {
      try {
        // Set feedback generating flag BEFORE stopping the call
        // to prevent race conditions with the call-end event
        setIsFeedbackGenerating(true)
        
        // Force the interview to end
        await vapiRef.current.stop()
        setIsCallActive(false)
        toast.success('Interview stopped', { id: "ending-interview" })
        
        // The call-end event will NOT trigger generateFeedback again
        // because isFeedbackGenerating is already true
        // Call it directly here
        generateFeedback()
      } catch (error) {
        console.error('Error stopping interview:', error)
        toast.error('Error stopping interview', { id: "ending-interview" })
        setIsEnding(false)
        setIsFeedbackGenerating(false) // Reset the flag on error
      }
    } else {
      toast.error('Interview is not active', { id: "ending-interview" })
      setIsEnding(false)
    }
  }

  const generateFeedback = async () => {
    // This is a safety check, but with the changes above, this should never happen
    if (isFeedbackGenerating && document.getElementById('feedback-in-progress')) {
      console.log("Feedback generation already in progress")
      return
    }
    
    // Create a hidden marker to prevent race conditions
    const marker = document.createElement('div')
    marker.id = 'feedback-in-progress'
    marker.style.display = 'none'
    document.body.appendChild(marker)
    
    try {
      // Show loading toast with longer duration
      toast.loading("Generating interview feedback... Please wait", { 
        id: "generating-feedback",
        duration: 60000 // 60 seconds (much longer than default)
      })
  
      // Always proceed with whatever conversation data we have
      const conversationData = conversation || { messages: [] }
      console.log("Starting feedback generation with conversation data:", conversationData)
      
      // 1. Get feedback from API
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversationData
      })
  
      console.log("API Response:", result?.data)
      
      if (!result?.data?.content) {
        throw new Error("Invalid feedback response from API")
      }
      
      const content = result.data.content
      const finalContent = content.replace(/```json|```/g, '').trim()
  
      console.log("Parsed content:", finalContent)
      
      // 2. Parse JSON
      let parsedFeedback
      try {
        parsedFeedback = JSON.parse(finalContent)
      } catch (error) {
        console.error("Error parsing feedback JSON:", error, "Content was:", finalContent)
        toast.error("Error processing interview feedback", { id: "generating-feedback" })
        setIsFeedbackGenerating(false)
        setIsEnding(false)
        document.body.removeChild(marker)
        return
      }
  
      // 3. Check if feedback already exists for this interview to prevent duplicates
      const { data: existingData } = await supabase
        .from('interview-feedback')
        .select('id')
        .eq('interview_id', interview_id)
        .eq('userEmail', interviewInfo?.userEmail)
        
      if (existingData && existingData.length > 0) {
        console.log("Feedback already exists for this interview, skipping save")
        toast.success("Interview feedback already saved! Redirecting...", { id: "generating-feedback" })
        
        // Navigate to completed page
        setTimeout(() => {
          setIsFeedbackGenerating(false)
          setIsEnding(false)
          document.body.removeChild(marker)
          router.replace('/interview/' + interview_id + '/completed')
        }, 2500)
        return
      }
  
      // 4. Save to database only if no existing feedback
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
        toast.error("Failed to save interview feedback", { id: "generating-feedback" })
        setIsFeedbackGenerating(false)
        setIsEnding(false)
        document.body.removeChild(marker)
        return
      }
  
      // 5. Only navigate after successful save
      console.log("Data saved to supabase:", data)
      toast.success("Interview feedback saved! Redirecting...", { id: "generating-feedback" })
      
      // Add a longer delay before navigation to ensure user sees success message
      setTimeout(() => {
        setIsFeedbackGenerating(false)
        setIsEnding(false)
        document.body.removeChild(marker)
        router.replace('/interview/' + interview_id + '/completed')
      }, 2500)
  
    } catch (error) {
      console.error("Error in generateFeedback:", error)
      toast.error("Failed to generate feedback. Please try again.", { id: "generating-feedback" })
      setIsFeedbackGenerating(false)
      setIsEnding(false)
      if (marker && marker.parentNode) {
        document.body.removeChild(marker)
      }
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
        
        {(isEnding || isFeedbackGenerating) ? (
          <div className='text-white h-10 w-10 p-2 bg-gray-500 rounded-full flex items-center justify-center'>
            <Loader2 className='animate-spin' size={20} />
          </div>
        ) : (
          <AlertConfiirmation stopInterview={stopInterview} disabled={isEnding || isFeedbackGenerating}>
            <Phone className='text-white h-10 w-10 p-3 bg-red-500 cursor-pointer rounded-full' />
          </AlertConfiirmation>
        )}
      </div>
      
      <h2 className='text-sm text-gray-400 text-center mt-5'>
        {isEnding ? 'Ending interview...' : 
         isFeedbackGenerating ? (
           <div className="flex items-center justify-center gap-2">
             <span>Generating feedback, please wait</span>
             <Loader2 className="animate-spin" size={16} />
           </div>
         ) : 
         isCallActive ? 'Interview in Progress....' : 
         'Interview not active'}
      </h2>
    </div>
  )
}

export default StartInterview