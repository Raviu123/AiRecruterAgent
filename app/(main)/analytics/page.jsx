"use client"
import React, { useEffect, useState } from 'react'
import { fetchCandidateAnalyticsSummary } from '@/modules/analytics/analyticsService'
import { useUser } from '@/app/provider'
import { BarChart3, Mic, Brain, Award } from 'lucide-react'

export default function AnalyticsPage() {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState({
    totalMockInterviews: 0,
    totalAptitudeQuizzes: 0,
    avgAptitudeAccuracy: 0,
    recentInterviews: [],
    recentQuizzes: []
  });

  useEffect(() => {
    if (user?.email) {
      fetchCandidateAnalyticsSummary(user.email).then(setAnalytics);
    }
  }, [user]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preparation Analytics & History</h1>
        <p className="text-gray-500 mt-1">
          Track your overall interview readiness, voice mock ratings, and aptitude test scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <Mic className="h-10 w-10 text-blue-600 bg-blue-50 p-2 rounded-lg" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Mock Interviews</p>
            <h3 className="text-2xl font-bold">{analytics.totalMockInterviews} Completed</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <Brain className="h-10 w-10 text-purple-600 bg-purple-50 p-2 rounded-lg" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Aptitude Quizzes</p>
            <h3 className="text-2xl font-bold">{analytics.totalAptitudeQuizzes} Completed</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <Award className="h-10 w-10 text-emerald-600 bg-emerald-50 p-2 rounded-lg" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Aptitude Accuracy</p>
            <h3 className="text-2xl font-bold">{analytics.avgAptitudeAccuracy}% Avg</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          Recent Mock Interview Sessions
        </h2>
        {analytics.recentInterviews.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentInterviews.map((item, idx) => (
              <div key={idx} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.jobTitle}</h4>
                  <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  {item.duration} Mins
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No mock interview sessions recorded yet. Start a session from the dashboard!</p>
        )}
      </div>
    </div>
  )
}
