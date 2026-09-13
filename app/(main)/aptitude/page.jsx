"use client"
import React, { useState } from 'react'
import { APTITUDE_CATEGORIES, APTITUDE_TOPICS } from '@/modules/aptitude/aptitudeService'
import { Brain, BookOpen, Clock, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AptitudePlaygroundPage() {
  const [selectedCategory, setSelectedCategory] = useState(APTITUDE_CATEGORIES[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [isQuizActive, setIsQuizActive] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aptitude Learning Playground</h1>
        <p className="text-gray-500 mt-1">
          Master quantitative, reasoning, and verbal aptitude with practice tests ingested from standard reference books.
        </p>
      </div>

      {!isQuizActive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Configure Test Drill
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {APTITUDE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexity / Difficulty</label>
                <div className="flex gap-3">
                  {["easy", "medium", "hard", "mixed"].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`capitalize px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedDifficulty === diff
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                <div className="flex gap-3">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        questionCount === count
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setIsQuizActive(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4 py-3"
              >
                Generate & Start Aptitude Quiz
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-semibold">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Featured Topics
              </div>
              <ul className="text-sm text-purple-800 space-y-1.5 list-disc list-inside">
                {APTITUDE_TOPICS[selectedCategory]?.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <Clock className="h-5 w-5 text-gray-500" />
                Timed Practice Mode
              </div>
              <p className="text-xs text-gray-500">
                Each question allows 60 seconds. Get detailed step-by-step solutions after submission.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-4">
          <Award className="h-12 w-12 text-purple-600 mx-auto" />
          <h2 className="text-2xl font-bold">Quiz Session Initialized</h2>
          <p className="text-gray-500">
            Selected: {selectedCategory} ({selectedDifficulty}) — {questionCount} Questions.
          </p>
          <Button onClick={() => setIsQuizActive(false)} variant="outline">
            Exit Quiz & Return to Configurator
          </Button>
        </div>
      )}
    </div>
  )
}
