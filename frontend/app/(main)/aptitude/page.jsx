"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/app/provider'
import {
  EMPTY_CATALOG,
  fetchAptitudeAttempt,
  fetchAptitudeAttempts,
  fetchAptitudeCatalog,
  startAptitudeQuiz,
  submitAptitudeQuiz,
} from '@/modules/aptitude/aptitudeService'
import AttemptHistory from './_components/AttemptHistory'
import QuizConfigurator from './_components/QuizConfigurator'
import QuizResults from './_components/QuizResults'
import QuizRunner from './_components/QuizRunner'

const CONFIG = "config"
const QUIZ = "quiz"
const RESULT = "result"

const DEFAULT_CONFIG = { category: "", topic: "", difficulty: "mixed", questionCount: 10 }

/**
 * Aptitude playground: configure a drill, sit the timed paper, then review the marked
 * answers. Questions come from the seeded Supabase bank via the backend - nothing here
 * calls the database or an LLM directly.
 */
export default function AptitudePlaygroundPage() {
  const { user } = useUser()

  const [catalog, setCatalog] = useState(EMPTY_CATALOG)
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  const [stage, setStage] = useState(CONFIG)
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [attempts, setAttempts] = useState([])

  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openingAttemptId, setOpeningAttemptId] = useState(null)

  const loadAttempts = useCallback(
    () =>
      fetchAptitudeAttempts()
        .then(setAttempts)
        .catch((err) => {
          console.error("Error loading aptitude attempts:", err)
        }),
    []
  )

  useEffect(() => {
    if (!user?.email) return

    setIsLoadingCatalog(true)
    fetchAptitudeCatalog()
      .then(setCatalog)
      .catch((err) => {
        console.error("Error loading aptitude catalog:", err)
        toast.error(`Could not load the question bank: ${err.message}`)
      })
      .finally(() => setIsLoadingCatalog(false))

    loadAttempts()
  }, [user, loadAttempts])

  // Each stage is a full-page swap, so start the new view from the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [stage])

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const paper = await startAptitudeQuiz(config)
      setQuiz(paper)
      setResult(null)
      setStage(QUIZ)
    } catch (err) {
      console.error("Error starting aptitude quiz:", err)
      toast.error(`Could not start the quiz: ${err.message}`)
    } finally {
      setIsStarting(false)
    }
  }

  const handleSubmit = async (submission, autoSubmitted) => {
    setIsSubmitting(true)
    try {
      const marked = await submitAptitudeQuiz(quiz.quizId, submission)
      setResult(marked)
      setStage(RESULT)
      toast[autoSubmitted ? "warning" : "success"](
        autoSubmitted
          ? `Time is up — scored ${marked.score}/${marked.totalQuestions}.`
          : `Scored ${marked.score}/${marked.totalQuestions} (${marked.accuracy}%).`
      )
      loadAttempts()
    } catch (err) {
      console.error("Error submitting aptitude quiz:", err)
      toast.error(`Could not submit the quiz: ${err.message}`)
      // Re-thrown so the runner clears its guard and the candidate can try again.
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReview = async (attemptId) => {
    setOpeningAttemptId(attemptId)
    try {
      const attempt = await fetchAptitudeAttempt(attemptId)
      setResult(attempt)
      // So "Retake" from this review runs the same drill the attempt used.
      setConfig({
        category: attempt.category || "",
        topic: attempt.topic || "",
        difficulty: attempt.difficulty || "mixed",
        questionCount: attempt.totalQuestions || DEFAULT_CONFIG.questionCount,
      })
      setQuiz(null)
      setStage(RESULT)
    } catch (err) {
      console.error("Error loading attempt review:", err)
      toast.error(`Could not open that attempt: ${err.message}`)
    } finally {
      setOpeningAttemptId(null)
    }
  }

  const backToConfig = () => {
    setQuiz(null)
    setStage(CONFIG)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aptitude Learning Playground</h1>
          <p className="text-gray-500 mt-1">
            {stage === QUIZ
              ? "Answer at your own pace — you can revisit any question before submitting."
              : "Practise quantitative aptitude with papers drawn from a curated question bank."}
          </p>
        </div>
        {stage === RESULT && (
          <Button variant="outline" onClick={backToConfig}>
            Back to Playground
          </Button>
        )}
      </div>

      {stage === CONFIG &&
        (isLoadingCatalog ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading the question bank...
          </div>
        ) : (
          <>
            <QuizConfigurator
              catalog={catalog}
              config={config}
              onChange={setConfig}
              onStart={handleStart}
              isStarting={isStarting}
            />
            <AttemptHistory
              attempts={attempts}
              onReview={handleReview}
              openingAttemptId={openingAttemptId}
            />
          </>
        ))}

      {stage === QUIZ && quiz && (
        <QuizRunner
          key={quiz.quizId}
          quiz={quiz}
          onSubmit={handleSubmit}
          onExit={backToConfig}
          isSubmitting={isSubmitting}
        />
      )}

      {stage === RESULT && result && (
        <QuizResults
          result={result}
          onRetake={handleStart}
          onNewDrill={backToConfig}
        />
      )}
    </div>
  )
}
