"use client"
import React, { useMemo } from 'react'
import { Brain, BookOpen, Clock, Layers, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DIFFICULTY_OPTIONS, QUESTION_COUNT_OPTIONS } from '@/modules/aptitude/aptitudeService'

const ALL_CATEGORIES = ""
const ALL_TOPICS = ""

function OptionButton({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
        active
          ? "border-purple-600 bg-purple-50 text-purple-700"
          : "border-gray-200 hover:border-gray-300 text-gray-700"
      } ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Drill settings. Categories, topics and question counts come from the seeded bank,
 * so the form can only offer combinations the bank can actually fill.
 */
export default function QuizConfigurator({ catalog, config, onChange, onStart, isStarting }) {
  const categories = catalog.categories || []

  const selected = useMemo(
    () => categories.find((entry) => entry.category === config.category),
    [categories, config.category]
  )

  // How many questions the current settings can draw from - shown so a candidate
  // knows why a 20-question drill on a thin topic will repeat sooner.
  const available = useMemo(() => {
    const pool = selected ? [selected] : categories
    if (config.difficulty === "mixed") {
      return pool.reduce((total, entry) => total + entry.total, 0)
    }
    return pool.reduce((total, entry) => total + (entry.byDifficulty?.[config.difficulty] || 0), 0)
  }, [categories, selected, config.difficulty])

  const update = (patch) => onChange({ ...config, ...patch })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Configure Test Drill
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <OptionButton
              active={config.category === ALL_CATEGORIES}
              onClick={() => update({ category: ALL_CATEGORIES, topic: ALL_TOPICS })}
              className="text-left"
            >
              All Categories
              <span className="block text-xs font-normal text-gray-500">
                {catalog.totalQuestions} questions
              </span>
            </OptionButton>

            {categories.map((entry) => (
              <OptionButton
                key={entry.category}
                active={config.category === entry.category}
                onClick={() => update({ category: entry.category, topic: ALL_TOPICS })}
                className="text-left"
              >
                {entry.category}
                <span className="block text-xs font-normal text-gray-500">{entry.total} questions</span>
              </OptionButton>
            ))}
          </div>
        </div>

        {selected?.topics?.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Narrow to a Topic</label>
            <div className="flex flex-wrap gap-2">
              <OptionButton active={config.topic === ALL_TOPICS} onClick={() => update({ topic: ALL_TOPICS })}>
                All Topics
              </OptionButton>
              {selected.topics.map((topic) => (
                <OptionButton
                  key={topic}
                  active={config.topic === topic}
                  onClick={() => update({ topic })}
                >
                  {topic}
                </OptionButton>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Complexity / Difficulty</label>
          <div className="flex flex-wrap gap-3">
            {DIFFICULTY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                active={config.difficulty === option.value}
                onClick={() => update({ difficulty: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
          <div className="flex flex-wrap gap-3">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <OptionButton
                key={count}
                active={config.questionCount === count}
                onClick={() => update({ questionCount: count })}
              >
                {count} Questions
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            onClick={onStart}
            disabled={isStarting || available === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Drawing your paper...
              </>
            ) : (
              "Start Aptitude Quiz"
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            {available === 0
              ? "No questions in the bank match these settings yet."
              : `${available} question${available === 1 ? "" : "s"} available · questions and option order are
                 randomised, and recent questions are skipped so a repeat drill stays fresh.`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-semibold">
            <BookOpen className="h-5 w-5 text-purple-600" />
            {selected ? "Topics in this Category" : "Question Bank"}
          </div>
          <ul className="text-sm text-purple-800 space-y-1.5 list-disc list-inside">
            {(selected ? selected.topics : categories.map((entry) => entry.category)).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Layers className="h-5 w-5 text-gray-500" />
            Difficulty Mix
          </div>
          {selected ? (
            <p className="text-xs text-gray-500">
              Easy {selected.byDifficulty.easy} · Medium {selected.byDifficulty.medium} · Hard{" "}
              {selected.byDifficulty.hard}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              &quot;Mixed&quot; weights the paper towards medium questions, the way a real test does.
            </p>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Clock className="h-5 w-5 text-gray-500" />
            Timed Practice Mode
          </div>
          <p className="text-xs text-gray-500">
            You get 60 seconds per question overall. The quiz submits itself when the clock runs
            out, and you get step-by-step solutions straight after.
          </p>
        </div>
      </div>
    </div>
  )
}
