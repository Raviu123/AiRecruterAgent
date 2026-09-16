"use client"
import React from 'react'
import { Award, Check, Clock, MinusCircle, RotateCcw, Sliders, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { accuracyTone, formatDuration } from '@/modules/aptitude/aptitudeService'

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]

function StatCard({ icon: Icon, label, value, hint, tone = "text-gray-900" }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
      <Icon className="h-10 w-10 text-purple-600 bg-purple-50 p-2 rounded-lg shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <h3 className={`text-2xl font-bold ${tone}`}>{value}</h3>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  )
}

function Breakdown({ title, buckets }) {
  if (!buckets?.length) return null
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {buckets.map((bucket) => (
        <div key={bucket.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="capitalize text-gray-700 truncate pr-3">{bucket.name}</span>
            <span className={`font-medium shrink-0 ${accuracyTone(bucket.accuracy)}`}>
              {bucket.correct}/{bucket.total}
            </span>
          </div>
          <Progress value={bucket.accuracy} />
        </div>
      ))}
    </div>
  )
}

/** Marked paper: score, weakest-first breakdowns and every question with its solution. */
export default function QuizResults({ result, onRetake, onNewDrill }) {
  const weakest = result.byTopic?.[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Award}
          label="Score"
          value={`${result.score} / ${result.totalQuestions}`}
          hint={`${result.accuracy}% accuracy`}
          tone={accuracyTone(result.accuracy)}
        />
        <StatCard
          icon={MinusCircle}
          label="Skipped"
          value={result.skipped}
          hint={`${result.totalQuestions - result.score - result.skipped} answered incorrectly`}
        />
        <StatCard
          icon={Clock}
          label="Time Taken"
          value={formatDuration(result.timeTakenSeconds)}
          hint={
            result.totalQuestions
              ? `${formatDuration(result.timeTakenSeconds / result.totalQuestions)} per question`
              : null
          }
        />
      </div>

      {weakest && weakest.accuracy < 100 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
          Weakest area this round: <strong>{weakest.name}</strong> ({weakest.correct}/{weakest.total}
          ). Run the drill again — you will get different questions from the same bank.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Breakdown title="By Topic" buckets={result.byTopic} />
        <Breakdown title="By Difficulty" buckets={result.byDifficulty} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetake} className="bg-purple-600 hover:bg-purple-700 text-white">
          <RotateCcw className="h-4 w-4" /> Retake with New Questions
        </Button>
        <Button variant="outline" onClick={onNewDrill}>
          <Sliders className="h-4 w-4" /> Change Settings
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Solutions</h2>
        {result.review.map((item) => (
          <div
            key={item.questionId}
            className={`bg-white p-5 rounded-xl border shadow-sm space-y-3 ${
              item.isCorrect ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-gray-900 whitespace-pre-line">
                {item.number}. {item.questionText}
              </p>
              <span
                className={`flex items-center gap-1 text-xs font-semibold shrink-0 px-2 py-1 rounded-full ${
                  item.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {item.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {item.isCorrect ? "Correct" : item.selectedIndex === null ? "Skipped" : "Wrong"}
              </span>
            </div>

            <div className="grid gap-2">
              {item.options.map((option, index) => {
                const isCorrect = index === item.correctIndex
                const isChosen = index === item.selectedIndex
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : isChosen
                          ? "border-red-300 bg-red-50 text-red-900"
                          : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <span className="font-semibold">{OPTION_LABELS[index] || index + 1}</span>
                    <span className="flex-1">{option}</span>
                    {isChosen && <span className="text-xs font-medium">Your answer</span>}
                    {isCorrect && !isChosen && <span className="text-xs font-medium">Correct answer</span>}
                  </div>
                )
              })}
            </div>

            {item.explanation && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Solution</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{item.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
