"use client"
import React, { useState } from 'react'
import { ArrowLeft, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"
import FormContainer from '../dashboard/create-interview/_component/FormContainer'
import QuestionList from '../dashboard/create-interview/_component/QuestionList'
import InterviewLink from '../dashboard/create-interview/_component/interviewLink'
import { toast } from "sonner"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MockInterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [interviewId, setInterviewId] = useState(null);
  const [formData, setFormData] = useState({
    jobposition: "",
    jobdescription: "",
    interviewduration: "",
    type: []
  });

  const OnhandleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onGoToNext = () => {
    if (!formData?.jobposition || !formData?.jobdescription || !formData?.interviewduration) {
      toast.error("Please fill in Job Title, Job Description, and Duration");
      return;
    }
    setStep(step + 1);
  };

  const onCreateLink = (createdId) => {
    setInterviewId(createdId);
    setStep(step + 1);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeft onClick={() => router.back()} className="cursor-pointer h-6 w-6 text-gray-600 hover:text-gray-900" />
          <h1 className="text-2xl font-bold tracking-tight">Self-Service JD Mock Interview</h1>
        </div>
        {interviewId && (
          <Link href={`/interview/${interviewId}/start`}>
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Video className="h-4 w-4"/> Start Voice Call Now
            </Button>
          </Link>
        )}
      </div>

      <p className="text-gray-500 text-sm">
        Input target Job Description to generate tailored technical & behavioral interview questions and launch your live voice session.
      </p>

      <Progress value={step * 33.33} className="my-4" />

      {step === 1 && (
        <FormContainer OnhandleInputChange={OnhandleInputChange} GoToNext={onGoToNext} />
      )}

      {step === 2 && (
        <QuestionList formData={formData} onCreateLink={onCreateLink} />
      )}

      {step === 3 && (
        <div className="space-y-6">
          <InterviewLink interview_id={interviewId} formData={formData} />
          <div className="text-center pt-4">
            <Link href={`/interview/${interviewId}/start`}>
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 px-8 py-3 text-lg rounded-xl gap-3 shadow-md">
                <Video className="h-6 w-6" /> Start Voice Mock Interview Session Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
