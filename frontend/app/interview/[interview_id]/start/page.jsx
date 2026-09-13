"use client"
import React, { useContext, useState, useEffect, useRef } from 'react'
import InterviewDataContext from '@/context/interviewDataContext'
import { Timer, Mic, Phone, Volume2, Loader2, AlertCircle, CheckCircle2, Keyboard, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import AlertConfiirmation from './_components/AlertConfiirmation'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUser } from '@/app/provider'
import { createVapiInstance, describeVapiError, isVoiceConfigured, toTranscript } from '@/modules/mock-interview/vapiService'
import { getAssistantConfig, getInterview, submitInterviewFeedback } from '@/modules/mock-interview/mockInterviewService'
import { Button } from '@/components/ui/button'

// ready -> connecting -> voice | text -> submitting -> (redirect) | failed
const PHASE = {
  READY: 'ready',
  CONNECTING: 'connecting',
  VOICE: 'voice',
  TEXT: 'text',
  SUBMITTING: 'submitting',
  FAILED: 'failed',
}

const questionText = (q) => (typeof q === 'string' ? q : q?.question || '')

const formatElapsed = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export default function StartInterview() {
  const { interviewInfo } = useContext(InterviewDataContext)
  const { user } = useUser()
  const { interview_id } = useParams()
  const router = useRouter()

  const [interview, setInterview] = useState(interviewInfo?.interviewData || null)
  const [loadError, setLoadError] = useState(null)
  const [phase, setPhase] = useState(PHASE.READY)
  const [assistantSpeaking, setAssistantSpeaking] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [volume, setVolume] = useState(100)
  const [elapsed, setElapsed] = useState(0)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitError, setSubmitError] = useState(null)

  const vapiRef = useRef(null)
  const callStartedRef = useRef(false)
  const conversationRef = useRef([])      // from Vapi conversation-update events
  const finalTranscriptsRef = useRef([])  // backup built from final transcript events
  const submittingRef = useRef(false)
  const lastAttemptRef = useRef(null)
  const submitRef = useRef(null)

  const candidateName = interviewInfo?.userName || user?.name || 'Candidate'
  const candidateEmail = interviewInfo?.userEmail || user?.email || ''
  const questions = interview?.questionList || []
  const voiceAvailable = isVoiceConfigured()

  // Load interview when the room is opened directly (no lobby context)
  useEffect(() => {
    if (interview || !interview_id) return
    getInterview(interview_id)
      .then(setInterview)
      .catch((err) => {
        console.error('Error loading interview:', err)
        setLoadError(err.status === 404 ? 'Interview not found or link expired.' : err.message)
      })
  }, [interview_id, interview])

  // Session timer
  useEffect(() => {
    if (phase !== PHASE.VOICE && phase !== PHASE.TEXT) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Always stop an active call when leaving the page
  useEffect(() => () => teardownVapi(), [])

  const teardownVapi = () => {
    const vapi = vapiRef.current
    vapiRef.current = null
    if (!vapi) return
    try {
      vapi.removeAllListeners()
      vapi.stop()
    } catch (error) {
      console.error('Error during Vapi cleanup:', error)
    }
  }

  const submitAttempt = async (conversation, mode) => {
    if (submittingRef.current) return
    submittingRef.current = true
    lastAttemptRef.current = { conversation, mode }
    setSubmitError(null)
    setPhase(PHASE.SUBMITTING)

    try {
      const result = await submitInterviewFeedback(interview_id, {
        userName: candidateName,
        userEmail: candidateEmail,
        conversation,
        mode,
      })
      toast.success('Feedback report ready!')
      router.replace(`/interview/${interview_id}/completed?feedback=${result.id}`)
    } catch (err) {
      console.error('Error generating feedback:', err)
      submittingRef.current = false
      setSubmitError(err.message)
      setPhase(PHASE.FAILED)
    }
  }
  // Vapi listeners are bound once; route them to the latest closure.
  submitRef.current = submitAttempt

  const finishVoiceCall = () => {
    if (!callStartedRef.current) return
    callStartedRef.current = false
    teardownVapi()
    const conversation = conversationRef.current.length > 0 ? conversationRef.current : finalTranscriptsRef.current
    submitRef.current(conversation, 'voice')
  }

  const bindVapiEvents = (vapi) => {
    vapi.on('call-start', () => {
      callStartedRef.current = true
      setPhase(PHASE.VOICE)
      toast.success('Voice session connected')
    })
    vapi.on('speech-start', () => setAssistantSpeaking(true))
    vapi.on('speech-end', () => setAssistantSpeaking(false))
    vapi.on('message', (message) => {
      if (message?.type === 'conversation-update') {
        conversationRef.current = toTranscript(message.conversation)
        setTranscript(conversationRef.current)
      } else if (message?.type === 'transcript' && message.transcriptType === 'final' && message.transcript) {
        finalTranscriptsRef.current = [...finalTranscriptsRef.current, { role: message.role, content: message.transcript }]
        if (conversationRef.current.length === 0) setTranscript(finalTranscriptsRef.current)
      }
    })
    vapi.on('call-end', finishVoiceCall)
    vapi.on('error', (error) => {
      console.error('Vapi error:', error)
      if (!callStartedRef.current) {
        teardownVapi()
        setPhase(PHASE.READY)
        toast.error(`${describeVapiError(error)} You can use text mode instead.`, { duration: 10000 })
      }
    })
  }

  const startVoiceInterview = async () => {
    const vapi = createVapiInstance()
    if (!vapi) {
      toast.error('Voice interviewer is not configured: NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing or a placeholder. Use text mode instead.')
      return
    }
    conversationRef.current = []
    finalTranscriptsRef.current = []
    setTranscript([])
    setElapsed(0)
    vapiRef.current = vapi
    setPhase(PHASE.CONNECTING)

    try {
      const assistant = await getAssistantConfig(interview_id, candidateName)
      bindVapiEvents(vapi)
      await vapi.start(assistant)
    } catch (err) {
      console.error('Failed to start voice interview:', err)
      teardownVapi()
      setPhase(PHASE.READY)
      toast.error(`Could not start voice interview: ${err?.message || 'unknown error'}`)
    }
  }

  const endVoiceInterview = () => {
    // Don't wait for `call-end`; finishVoiceCall runs only once and detaches the listeners.
    finishVoiceCall()
  }

  const startTextInterview = () => {
    setElapsed(0)
    setCurrentQIndex(0)
    setPhase(PHASE.TEXT)
  }

  const finishTextInterview = () => {
    const conversation = questions.flatMap((q, idx) => {
      const answer = (answers[idx] || '').trim()
      const turns = [{ role: 'assistant', content: questionText(q) }]
      return answer ? [...turns, { role: 'user', content: answer }] : turns
    })
    if (!conversation.some((turn) => turn.role === 'user')) {
      toast.error('Answer at least one question before requesting feedback.')
      return
    }
    submitAttempt(conversation, 'text')
  }

  const retrySubmission = () => {
    if (lastAttemptRef.current) {
      submitAttempt(lastAttemptRef.current.conversation, lastAttemptRef.current.mode)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    document.querySelectorAll('audio').forEach((audio) => {
      audio.volume = newVolume / 100
    })
  }

  const answeredCount = Object.values(answers).filter((a) => a?.trim()).length

  if (loadError) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <div className='bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-3 max-w-md'>
          <AlertCircle className='h-10 w-10 text-red-500 mx-auto' />
          <h2 className='font-bold text-lg text-gray-900'>Unable to open interview</h2>
          <p className='text-sm text-gray-500'>{loadError}</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='animate-spin h-8 w-8 text-blue-600' />
      </div>
    )
  }

  return (
    <div className='p-6 lg:px-36 xl:px-48 bg-gray-50 min-h-screen'>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <h1 className='font-bold text-xl text-gray-900'>
              AI Mock Interview: {interview.jobposition || 'Target Role'}
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              {questions.length} questions · {interview.interviewduration || 15} minutes · Candidate: {candidateName}
            </p>
          </div>
          <div className='flex gap-2 items-center text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shrink-0'>
            <Timer className={`h-4 w-4 text-blue-600 ${phase === PHASE.VOICE ? 'animate-pulse' : ''}`} />
            <span>
              {phase === PHASE.VOICE ? `Live · ${formatElapsed(elapsed)}` :
               phase === PHASE.TEXT ? `Text practice · ${formatElapsed(elapsed)}` :
               phase === PHASE.CONNECTING ? 'Connecting...' :
               phase === PHASE.SUBMITTING ? 'Evaluating...' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Lobby */}
        {(phase === PHASE.READY || phase === PHASE.CONNECTING) && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6 text-center">
            <Image src={'/ai.jpg'} alt="AI Interviewer" width={90} height={90}
              className='w-[80px] h-[80px] rounded-full object-cover mx-auto border-4 border-blue-600 shadow-md' />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Choose how you want to practice</h2>
              <p className="text-sm text-gray-500 mt-1">
                Voice mode runs a live AI interviewer. Text mode lets you type answers question by question.
                Both produce a scored feedback report.
              </p>
            </div>

            {!voiceAvailable && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-800 text-sm text-left max-w-xl mx-auto">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <span>
                  Voice mode is unavailable: NEXT_PUBLIC_VAPI_PUBLIC_KEY in frontend/.env.local is missing or still a placeholder.
                  Add your Vapi public key and restart the dev server. Text mode works normally.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={startVoiceInterview}
                disabled={!voiceAvailable || phase === PHASE.CONNECTING || questions.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {phase === PHASE.CONNECTING ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
                {phase === PHASE.CONNECTING ? 'Connecting voice interviewer...' : 'Start Voice Interview'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={startTextInterview}
                disabled={phase === PHASE.CONNECTING || questions.length === 0}
                className="gap-2"
              >
                <Keyboard className="h-5 w-5" /> Practice in Text Mode
              </Button>
            </div>
          </div>
        )}

        {/* Live Voice Session */}
        {phase === PHASE.VOICE && (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-white h-[260px] p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 items-center justify-center'>
                <div className='relative'>
                  {assistantSpeaking && (
                    <span className='absolute inset-0 rounded-full bg-blue-500/30 opacity-75 animate-ping'/>
                  )}
                  <Image src={'/ai.jpg'} alt="AI Interviewer" width={90} height={90}
                    className='w-[80px] h-[80px] rounded-full object-cover relative z-10 border-4 border-blue-600 shadow-md' />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-base text-gray-900">AI Voice Interviewer</h3>
                  <p className="text-xs text-gray-500 mt-1">{assistantSpeaking ? 'Speaking...' : 'Listening...'}</p>
                </div>
              </div>

              <div className='bg-white h-[260px] p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 items-center justify-center'>
                <div className='relative'>
                  {!assistantSpeaking && (
                    <span className='absolute inset-0 rounded-full bg-emerald-500/30 opacity-75 animate-ping'/>
                  )}
                  <div className='text-3xl bg-blue-600 text-white w-20 h-20 rounded-full flex items-center justify-center font-bold relative z-10 shadow-md'>
                    {candidateName[0]?.toUpperCase() || 'C'}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-base text-gray-900">{candidateName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{assistantSpeaking ? 'Listening' : 'Your turn to speak'}</p>
                </div>
              </div>
            </div>

            {/* Live transcript */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm max-h-56 overflow-y-auto space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Live Transcript</h3>
              {transcript.length === 0 ? (
                <p className="text-sm text-gray-400">The conversation will appear here...</p>
              ) : (
                transcript.slice(-8).map((turn, idx) => (
                  <p key={idx} className="text-sm">
                    <span className={`font-semibold ${turn.role === 'assistant' ? 'text-blue-700' : 'text-emerald-700'}`}>
                      {turn.role === 'assistant' ? 'Interviewer' : candidateName}:
                    </span>{' '}
                    <span className="text-gray-700">{turn.content}</span>
                  </p>
                ))
              )}
            </div>

            <div className='flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-gray-200 max-w-sm mx-auto shadow-xs'>
              <Volume2 className='text-gray-500 h-4 w-4' />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className='w-36 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600'
              />
              <span className='text-xs font-medium text-gray-600 w-8 text-right'>{volume}%</span>
            </div>

            <div className='flex flex-col items-center gap-2 pt-2'>
              <AlertConfiirmation stopInterview={endVoiceInterview}>
                <Phone className='text-white h-12 w-12 p-3 bg-red-600 cursor-pointer rounded-full hover:bg-red-700 shadow-md transition-all' />
              </AlertConfiirmation>
              <p className='text-xs text-gray-500 font-medium'>End the interview to get your feedback report</p>
            </div>
          </>
        )}

        {/* Text Practice Mode */}
        {phase === PHASE.TEXT && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQIndex + 1} of {questions.length}
                </h2>
                <p className="text-xs text-gray-500">
                  Category: {questions[currentQIndex]?.type || 'General'} · {answeredCount} answered
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={currentQIndex >= questions.length - 1}
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                >
                  Next Question
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl space-y-2">
              <h3 className="text-sm font-semibold text-blue-900">Interview Question:</h3>
              <p className="text-base font-medium text-gray-800">{questionText(questions[currentQIndex])}</p>
              {questions[currentQIndex]?.hint && (
                <p className="text-xs text-blue-700 pt-2 border-t border-blue-200/60 mt-2">
                  💡 Hint / Key Points: {questions[currentQIndex].hint}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Your Answer:</label>
              <textarea
                rows={7}
                value={answers[currentQIndex] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQIndex]: e.target.value }))}
                placeholder="Type your answer as you would say it in the interview..."
                className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setPhase(PHASE.READY)}>
                Back to Mode Selection
              </Button>
              <Button onClick={finishTextInterview} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Finish Interview & Get Feedback
              </Button>
            </div>
          </div>
        )}

        {/* Evaluating */}
        {phase === PHASE.SUBMITTING && (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">Generating your feedback report...</h2>
            <p className="text-sm text-gray-500">The AI is reviewing your answers. This usually takes a few seconds.</p>
          </div>
        )}

        {/* Evaluation failed */}
        {phase === PHASE.FAILED && (
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Could not generate feedback</h2>
              <p className="text-sm text-gray-600 mt-1">{submitError}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={retrySubmission} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Retry Evaluation
              </Button>
              <Button variant="outline" onClick={() => setPhase(lastAttemptRef.current?.mode === 'text' ? PHASE.TEXT : PHASE.READY)}>
                {lastAttemptRef.current?.mode === 'text' ? 'Back to My Answers' : 'Start Over'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
