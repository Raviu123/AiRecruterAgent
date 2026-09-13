"use client"
import React, { Suspense, useEffect, useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  Brain, 
  Code, 
  MessageSquare, 
  Briefcase, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  RotateCcw, 
  LayoutDashboard,
  Loader2Icon
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { fetchInterviewFeedback, getInterview } from '@/modules/mock-interview/mockInterviewService';

export default function CompletedPage() {
  return (
    <Suspense fallback={<ReportLoading />}>
      <CandidateFeedbackReport />
    </Suspense>
  );
}

function ReportLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <Loader2Icon className="animate-spin h-10 w-10 text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">Loading your Candidate Feedback Report...</p>
    </div>
  );
}

function CandidateFeedbackReport() {
  const { interview_id } = useParams();
  const feedbackId = useSearchParams().get('feedback');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [interviewData, setInterviewData] = useState(null);

  useEffect(() => {
    if (interview_id) {
      loadReportData();
    }
  }, [interview_id, feedbackId]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [interview, feedbackRecord] = await Promise.all([
        getInterview(interview_id),
        feedbackId ? fetchInterviewFeedback(interview_id, feedbackId) : Promise.resolve(null)
      ]);
      setInterviewData(interview);
      if (!feedbackRecord) {
        setError("No feedback report was specified for this session.");
      } else {
        setFeedbackData(feedbackRecord.feedback);
      }
    } catch (err) {
      console.error("Error loading feedback report:", err);
      setError(err.status === 404 ? "This feedback report could not be found." : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ReportLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center space-y-4 max-w-md">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-bold text-gray-900">Report unavailable</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <Link href={`/interview/${interview_id}`}>
            <Button className="gap-2"><RotateCcw className="h-4 w-4" /> Take the Interview</Button>
          </Link>
        </div>
      </div>
    );
  }

  const fb = feedbackData?.feedback || feedbackData || {};
  const rating = fb.rating || {};
  const technicalSkills = rating.technicalSkills ?? rating.techicalSkills ?? 0;
  const experience = rating.experience ?? rating.experince ?? 0;
  const overallScore = rating.overallScore ?? Math.round(((technicalSkills + (rating.communication ?? 0) + (rating.problemSolving ?? 0) + experience) / 4) * 10);

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
              <CheckCircle className="h-4 w-4" /> Session Complete
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Candidate Feedback Report: {interviewData?.jobposition || "Mock Interview"}
            </h1>
            <p className="text-gray-500 text-sm">
              Comprehensive performance analysis & personalized practice recommendations.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 shrink-0">
            <Award className="h-10 w-10 text-blue-600" />
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-700 font-semibold block">Readiness Score</span>
              <span className="text-2xl font-black text-blue-900">{overallScore}/100</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Executive Performance Assessment
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
              {fb.recommendation || fb.Recommendation || "Not rated"}
            </span>
          </div>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
            {fb.summary || fb.summery || "No summary available."}
          </p>
          {fb.recommendationMsg && (
            <p className="text-xs font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
              💡 <span className="font-semibold text-gray-700">Key Assessment Note:</span> {fb.recommendationMsg}
            </p>
          )}
        </div>

        {/* Rating Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Code className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500">Technical Skills</span>
            <span className="text-xl font-bold text-gray-900">{technicalSkills}/10</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <MessageSquare className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500">Communication</span>
            <span className="text-xl font-bold text-gray-900">{rating.communication ?? 0}/10</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500">Problem Solving</span>
            <span className="text-xl font-bold text-gray-900">{rating.problemSolving ?? 0}/10</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-gray-500">Experience Alignment</span>
            <span className="text-xl font-bold text-gray-900">{experience}/10</span>
          </div>
        </div>

        {/* Strengths & Improvements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Core Strengths
            </h3>
            <ul className="space-y-3">
              {(fb.strengths || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Areas for Improvement */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {(fb.improvements || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Preparation Advice */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-md">
          <h3 className="text-lg font-bold flex items-center gap-2 text-blue-200">
            <Lightbulb className="h-6 w-6 text-amber-300" /> Actionable Next Step Preparation Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {(fb.preparationAdvice || []).map((tip, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-xs sm:text-sm leading-relaxed">
                <span className="text-blue-300 font-bold block mb-1">Tip #{idx + 1}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Link href="/mock-interview" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 border-gray-300">
              <RotateCcw className="h-4 w-4" /> Practice Another Mock Interview
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/analytics" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300">
                <TrendingUp className="h-4 w-4" /> View Analytics & History
              </Button>
            </Link>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}