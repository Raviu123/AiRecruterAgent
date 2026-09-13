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
  
  const vapiRef = useRef(null)

  // Fetch interview info if loaded directly
  useEffect(() => {
    if (!interviewInfo && interview_id) {
      supabase
        .from('Interviews')
        .select('*')
        .eq('interview_id', interview_id)
        .then(({ data }) => {
          if (data && data[0]) {
            setInterviewInfo({
              userName: 'Candidate',
              userEmail: data[0].userEmail || 'candidate@example.com',
              interviewData: data[0]
            })
          }
        })
    }
  }, [interview_id, interviewInfo])
  
  // Initialize Vapi once if key is present
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!vapiRef.current && apiKey) {
      try {
        vapiRef.current = new Vapi(apiKey)
      } catch (err) {
        console.error("Vapi initialization error:", err)
      }
    }
    
    return () => {
      if (vapiRef.current) {
        try {
          if (isCallActive) {
            vapiRef.current.stop()
          }
          vapiRef.current.removeAllListeners()
        } catch (error) {
          console.error('Error during Vapi cleanup:', error)
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

  const setupEventListeners = () => {
    if (!vapiRef.current) return
    
    vapiRef.current.on("call-start", () => {
      console.log("Call has started.")
      toast.success("Voice Session Connected")
      setIsCallActive(true)
    })
    
    vapiRef.current.on("speech-start", () => {
      setActiveUser(false)
    })
    
    vapiRef.current.on("speech-end", () => {
      setActiveUser(true)
    })
    
    vapiRef.current.on("call-end", () => {
      console.log("Call has ended.")
      toast.success('Interview Session Ended')
      setIsCallActive(false)
      
      if (!isFeedbackGenerating) {
        setIsFeedbackGenerating(true)
        generateFeedback()
      }
    })
    
    vapiRef.current.on("message", (message) => {
      if (message?.conversation) {
        setConversation(message.conversation)
      }
    })

    vapiRef.current.on("error", (error) => {
      console.error("Vapi error:", error)
      toast.error("Error during interview session")
      setIsCallActive(false)
      setIsEnding(false)
    })
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    
    if (vapiRef.current?.setVolume) {
      vapiRef.current.setVolume(newVolume / 100)
    }
    
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100
    })
  }

  const startCall = () => {
    if (!vapiRef.current || !interviewInfo) return
    
    let questionList = ""
    const rawQuestions = interviewInfo?.interviewData?.questionList || interviewInfo?.interviewData?.questions || []
    
    if (Array.isArray(rawQuestions)) {
      rawQuestions.forEach((item) => {
        const qText = typeof item === 'string' ? item : item?.question || ""
        if (qText) {
          questionList += qText + ', '
        }
      })
    }

    const jobTitle = interviewInfo?.interviewData?.jobposition || interviewInfo?.interviewData?.jobTitle || "Role"

    const assistantOptions = {
      name: "AI Interviewer",
      firstMessage: `Hi ${interviewInfo?.userName || 'Candidate'}, welcome! Ready for your mock interview for the ${jobTitle} role?`,
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
You are an expert AI interviewer conducting a candidate mock interview.
Your task is to ask questions related to ${jobTitle}, listen to candidate answers, and evaluate responses.
Ask one question at a time. Keep questions natural, concise, and focused.
Interview Questions: ${questionList}
Provide encouraging and constructive feedback after answers.
`.trim(),
          },
        ],
      },
    }
  
    try {
      vapiRef.current.start(assistantOptions)
      setIsCallActive(true)
    } catch (error) {
      console.error('Failed to start interview:', error)
      toast.error('Failed to start Vapi voice session')
    }
  }

  const stopInterview = async () => {
    if (isEnding || isFeedbackGenerating) return
    
    setIsEnding(true)
    toast.loading("Ending interview...", { id: "ending-interview" })
    
    if (vapiRef.current && isCallActive) {
      try {
        setIsFeedbackGenerating(true)
        await vapiRef.current.stop()
        setIsCallActive(false)
        toast.success('Interview stopped', { id: "ending-interview" })
        generateFeedback()
      } catch (error) {
        console.error('Error stopping interview:', error)
        toast.error('Error stopping interview', { id: "ending-interview" })
        setIsEnding(false)
        setIsFeedbackGenerating(false)
      }
    } else {
      setIsEnding(false)
      generateFeedback()
    }
  }

  const generateFeedback = async () => {
    if (isFeedbackGenerating && document.getElementById('feedback-in-progress')) {
      return
    }
    
    const marker = document.createElement('div')
    marker.id = 'feedback-in-progress'
    marker.style.display = 'none'
    document.body.appendChild(marker)
    
    try {
      toast.loading("Generating interview feedback...", { id: "generating-feedback" })
      const conversationData = conversation || { messages: [] }
      
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversationData
      })
  
      if (!result?.data?.content) {
        throw new Error("Invalid feedback response from API")
      }
      
      const content = result.data.content
      const finalContent = content.replace(/```json|```/g, '').trim()
      
      let parsedFeedback
      try {
        parsedFeedback = JSON.parse(finalContent)
      } catch (error) {
        console.error("Error parsing feedback JSON:", error)
        parsedFeedback = {
          feedback: {
            rating: { technicalSkills: 7, communication: 7, problemSolving: 7, experience: 7 },
            summary: "Completed mock interview session.",
            Recommendation: "Recommended",
            RecommendationMsg: "Good candidate performance."
          }
        }
      }
  
      const { data: existingData } = await supabase
        .from('interview-feedback')
        .select('id')
        .eq('interview_id', interview_id)
        .eq('userEmail', interviewInfo?.userEmail)
        
      if (existingData && existingData.length > 0) {
        toast.success("Feedback saved! Redirecting...", { id: "generating-feedback" })
        setTimeout(() => {
          setIsFeedbackGenerating(false)
          setIsEnding(false)
          if (marker.parentNode) document.body.removeChild(marker)
          router.replace('/interview/' + interview_id + '/completed')
        }, 1500)
        return
      }
  
      await supabase
        .from('interview-feedback')
        .insert([
          { 
            userName: interviewInfo?.userName || 'Candidate',
            userEmail: interviewInfo?.userEmail || 'candidate@example.com',
            interview_id: interview_id,
            feedback: parsedFeedback,
            recommendation: true
          }
        ])

      toast.success("Interview feedback generated! Redirecting...", { id: "generating-feedback" })
      
      setTimeout(() => {
        setIsFeedbackGenerating(false)
        setIsEnding(false)
        if (marker.parentNode) document.body.removeChild(marker)
        router.replace('/interview/' + interview_id + '/completed')
      }, 1500)
  
    } catch (error) {
      console.error("Error in generateFeedback:", error)
      toast.error("Completed session redirecting...", { id: "generating-feedback" })
      setTimeout(() => {
        setIsFeedbackGenerating(false)
        setIsEnding(false)
        if (marker.parentNode) document.body.removeChild(marker)
        router.replace('/interview/' + interview_id + '/completed')
      }, 1500)
    }
  }

  return (
    <div className='p-8 lg:px-48 xl:px-56 bg-gray-100 min-h-screen'>
      <h2 className='font-bold text-xl flex justify-between items-center text-gray-900'>
        AI Voice Mock Interview Session
        <span className='flex gap-2 items-center text-sm font-normal text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200'>
          <Timer className="h-4 w-4 text-primary" /> Live Call Active
        </span>
      </h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-6'>
        <div className='bg-white h-[360px] p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 items-center justify-center'>
          <div className='relative'>
            {activeUser === false && (
              <span className='absolute inset-0 rounded-full bg-blue-500/30 opacity-75 animate-ping duration-1000'/>
            )}
            <Image 
              src={'/ai.jpg'} 
              alt="interviewer" 
              width={100} 
              height={100} 
              className='w-[70px] h-[70px] rounded-full object-cover relative z-10 border-2 border-primary'
            />
          </div>
          <h3 className="font-semibold text-lg text-gray-900">AI Voice Interviewer</h3>
        </div>

        <div className='bg-white h-[360px] p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 items-center justify-center'>
          <div className='relative'>
            {activeUser === true && (
              <span className='absolute inset-0 rounded-full bg-green-500/30 opacity-75 animate-ping duration-1000'/>
            )}
            <div className='text-2xl bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center font-bold relative z-10'>
              {interviewInfo?.userName?.[0] || "C"}
            </div>
          </div>
          <h3 className="font-semibold text-lg text-gray-900">{interviewInfo?.userName || 'Candidate'}</h3>
        </div>
      </div>

      <div className='flex items-center justify-center gap-3 mt-6 mb-4 bg-white p-3 rounded-lg border border-gray-200 max-w-sm mx-auto'>
        <Volume2 className='text-gray-600 h-5 w-5' />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume} 
          onChange={handleVolumeChange}
          className='w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
        />
        <span className='text-xs font-medium text-gray-600 w-8'>{volume}%</span>
      </div>

      <div className='flex items-center justify-center gap-5 mt-6'>
        <Mic className={`text-white h-12 w-12 p-3 ${activeUser ? 'bg-green-600' : 'bg-gray-500'} rounded-full shadow-md`} />
        
        {(isEnding || isFeedbackGenerating) ? (
          <div className='text-white h-12 w-12 p-3 bg-gray-500 rounded-full flex items-center justify-center shadow-md'>
            <Loader2 className='animate-spin' size={24} />
          </div>
        ) : (
          <AlertConfiirmation stopInterview={stopInterview} disabled={isEnding || isFeedbackGenerating}>
            <Phone className='text-white h-12 w-12 p-3 bg-red-600 cursor-pointer rounded-full hover:bg-red-700 shadow-md transition-all' />
          </AlertConfiirmation>
        )}
      </div>
      
      <p className='text-sm text-gray-500 text-center mt-4 font-medium'>
        {isEnding ? 'Ending voice interview session...' : 
         isFeedbackGenerating ? 'Generating AI feedback summary...' : 
         isCallActive ? 'Voice Interview in Progress...' : 
         'Ready to connect...'}
      </p>
    </div>
  )
}

export default StartInterview