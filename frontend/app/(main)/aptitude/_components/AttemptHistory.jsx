"use client"
import React from 'react'
import { History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { accuracyTone, formatDuration } from '@/modules/aptitude/aptitudeService'

/** Past drills, newest first. Selecting one re-opens its stored marked paper. */
export default function AttemptHistory({ attempts, onReview, openingAttemptId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 p-5 pb-3 font-semibold text-gray-900">
        <History className="h-5 w-5 text-gray-500" />
        Recent Attempts
      </div>

      {attempts.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-500">
          No quizzes yet. Finish a drill and your score history shows up here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attempt.topic || attempt.category || "All Categories"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {attempt.difficulty} · {attempt.totalQuestions} questions ·{" "}
                  {formatDuration(attempt.timeTakenSeconds)} ·{" "}
                  {new Date(attempt.completed_at || attempt.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-sm font-bold ${accuracyTone(attempt.accuracy)}`}>
                    {attempt.score}/{attempt.totalQuestions}
                  </p>
                  <p className="text-xs text-gray-500">{attempt.accuracy}%</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(attempt.id)}
                  disabled={openingAttemptId === attempt.id}
                >
                  {openingAttemptId === attempt.id && <Loader2 className="h-3 w-3 animate-spin" />}
                  Review
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
