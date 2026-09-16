"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Loader2, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDuration } from '@/modules/aptitude/aptitudeService'

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]

const DIFFICULTY_BADGE = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-red-50 text-red-700 border-red-200",
}

/**
 * The timed quiz itself. Answers are kept per questionId (not per position) so they
 * survive jumping around the paper, and the clock is read from a fixed deadline so a
 * throttled background tab cannot hand out extra time.
 */
export default function QuizRunner({ quiz, onSubmit, onExit, isSubmitting }) {
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(quiz.durationSeconds)

  const deadlineRef = useRef(Date.now() + quiz.durationSeconds * 1000)
  const submittedRef = useRef(false)

  const questions = quiz.questions
  const question = questions[current]
  const answeredCount = Object.values(answers).filter((value) => value !== null && value !== undefined).length

  const submit = useCallback(
    (autoSubmitted = false) => {
      if (submittedRef.current) return
      submittedRef.current = true
      const elapsed = Math.round(quiz.durationSeconds - (deadlineRef.current - Date.now()) / 1000)
      const submission = onSubmit(
        {
          answers: questions.map((item) => ({
            questionId: item.questionId,
            selectedIndex: answers[item.questionId] ?? null,
          })),
          timeTakenSeconds: Math.max(0, Math.min(quiz.durationSeconds, elapsed)),
        },
        autoSubmitted
      )
      // A failed submit (offline, expired session) must not lock the candidate out of retrying.
      Promise.resolve(submission).catch(() => {
        submittedRef.current = false
      })
    },
    [answers, onSubmit, questions, quiz.durationSeconds]
  )

  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) submit(true)
    }, 1000)
    return () => clearInterval(tick)
  }, [submit])

  const selectOption = (optionIndex) => {
    setAnswers((previous) => ({
      ...previous,
      // Clicking the chosen option again clears it, so a guess can be withdrawn.
      [question.questionId]: previous[question.questionId] === optionIndex ? null : optionIndex,
    }))
  }

  const isLast = current === questions.length - 1
  const clockTone = useMemo(() => {
    if (secondsLeft <= 30) return "text-red-600"
    return secondsLeft <= 120 ? "text-amber-600" : "text-gray-700"
  }, [secondsLeft])

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {quiz.category || "All Categories"} · <span className="capitalize">{quiz.difficulty}</span>
          </p>
          <p className="text-xs text-gray-500">
            {answeredCount} of {questions.length} answered
          </p>
        </div>

        <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${clockTone}`}>
          <Clock className="h-5 w-5" />
          {formatDuration(secondsLeft)}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isSubmitting}>
              Exit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave this quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                Your answers will be discarded and this paper will not be scored. You can start a
                new drill any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction onClick={onExit}>Leave quiz</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Progress value={(answeredCount / questions.length) * 100} />

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Question {current + 1} of {questions.length}
          </span>
          <span
            className={`text-xs capitalize px-2 py-0.5 rounded-full border ${
              DIFFICULTY_BADGE[question.difficulty] || "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            {question.difficulty}
          </span>
        </div>

        <p className="text-lg font-medium text-gray-900 whitespace-pre-line">{question.questionText}</p>

        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const isSelected = answers[question.questionId] === index
            return (
              <button
                key={index}
                type="button"
                onClick={() => selectOption(index)}
                aria-pressed={isSelected}
                className={`flex items-start gap-3 text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50 text-purple-900"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300 text-gray-500"
                  }`}
                >
                  {OPTION_LABELS[index] || index + 1}
                </span>
                <span className="text-sm">{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((index) => Math.max(0, index - 1))}
          disabled={current === 0 || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="flex flex-wrap gap-1.5 order-last w-full justify-center sm:order-none sm:w-auto">
          {questions.map((item, index) => {
            const answered = answers[item.questionId] !== null && answers[item.questionId] !== undefined
            return (
              <button
                key={item.questionId}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to question ${index + 1}`}
                aria-current={index === current}
                className={`h-8 w-8 rounded-md border text-xs font-medium transition-all ${
                  index === current
                    ? "border-purple-600 bg-purple-600 text-white"
                    : answered
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>

        {isLast ? (
          <Button
            onClick={() => submit(false)}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrent((index) => Math.min(questions.length - 1, index + 1))}
            disabled={isSubmitting}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
