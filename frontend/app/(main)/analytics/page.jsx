"use client"
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EMPTY_ANALYTICS_SUMMARY, fetchCandidateAnalyticsSummary } from '@/modules/analytics/analyticsService'
import { useUser } from '@/app/provider'
import { BarChart3, Mic, Brain, Award } from 'lucide-react'

export default function AnalyticsPage() {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS_SUMMARY);

  useEffect(() => {
    if (user?.email) {
      fetchCandidateAnalyticsSummary()
        .then(setAnalytics)
        .catch((err) => {
          console.error("Error fetching analytics summary:", err);
          toast.error(`Could not load analytics: ${err.message}`);
        });
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
            <h3 className="text-2xl font-bold">{analytics.completedMockSessions} Completed</h3>
            <p className="text-xs text-gray-500">
              {analytics.totalMockInterviews} created · {analytics.avgInterviewScore}/100 avg score
            </p>
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
                  <h4 className="font-semibold text-gray-900">{item.jobposition}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()} · {item['interview-feedback']?.length || 0} attempt(s)
                  </p>
                </div>
                <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  {item.interviewduration} Mins
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
