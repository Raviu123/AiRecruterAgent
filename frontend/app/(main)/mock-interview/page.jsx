"use client"
import React, { useState } from 'react'
import { ArrowLeft, Video, Sparkles, CheckCircle, Plus, Trash2, Loader2, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InterviewType } from '@/services/Constants'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { generateQuestionsFromJD, createInterview } from '@/modules/mock-interview/mockInterviewService'

export default function MockInterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [interviewId, setInterviewId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    jobposition: "",
    jobdescription: "",
    interviewduration: "15",
    type: ["Technical", "Behavioural"]
  });

  const [questionList, setQuestionList] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("Technical");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocusClick = (typeName) => {
    setFormData(prev => {
      const current = prev.type || [];
      if (current.includes(typeName)) {
        return { ...prev, type: current.filter(t => t !== typeName) };
      } else {
        return { ...prev, type: [...current, typeName] };
      }
    });
  };

  const handleGenerateQuestions = async () => {
    if (!formData.jobposition || !formData.jobdescription) {
      toast.error("Please enter both target Job Title and Job Description");
      return;
    }

    setIsGenerating(true);
    toast.loading("Analyzing JD & Generating Question Matrix...", { id: "question-gen" });

    try {
      const { questions, source, warning } = await generateQuestionsFromJD(formData);
      setQuestionList(questions);
      if (source === "ai") {
        toast.success("Generated personalized questions!", { id: "question-gen" });
      } else {
        console.warn(warning);
        toast.warning("AI generation is unavailable, so generic questions were added. Edit them as needed.", { id: "question-gen" });
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to generate questions: ${err.message}`, { id: "question-gen" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setQuestionList(prev => [
      ...prev,
      { question: newQuestionText.trim(), type: newQuestionType }
    ]);
    setNewQuestionText("");
    toast.success("Question added to matrix");
  };

  const handleRemoveQuestion = (index) => {
    setQuestionList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndLaunch = async () => {
    if (!questionList || questionList.length === 0) {
      toast.error("Please ensure at least one question is present");
      return;
    }

    setIsSaving(true);

    try {
      const interview = await createInterview({
        jobposition: formData.jobposition,
        jobdescription: formData.jobdescription,
        interviewduration: formData.interviewduration,
        type: formData.type,
        questionList: questionList
      });

      setInterviewId(interview.interview_id);
      toast.success("Mock Interview Session Created!");
      setStep(3);
    } catch (err) {
      console.error("Error creating interview:", err);
      toast.error(err?.message || "Failed to save mock interview");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeft onClick={() => router.back()} className="cursor-pointer h-6 w-6 text-gray-600 hover:text-gray-900" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Self-Service JD Mock Interview</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Input target Job Description to generate tailored technical & behavioral interview questions.
            </p>
          </div>
        </div>
        {interviewId && (
          <Link href={`/interview/${interviewId}/start`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs">
              <Video className="h-4 w-4"/> Start Voice Session
            </Button>
          </Link>
        )}
      </div>

      <Progress value={step * 33.33} className="my-4 h-2" />

      {/* Step 1: JD Input Form */}
      {step === 1 && (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            <span>AI powered question generator parses key responsibilities and tech stack requirements.</span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800 block mb-1">Job Position / Target Role</label>
            <Input 
              placeholder="e.g. Senior Fullstack Engineer, Data Scientist, Product Manager" 
              value={formData.jobposition}
              onChange={(e) => handleInputChange('jobposition', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-800 block mb-1">Target Job Description</label>
            <Textarea 
              placeholder="Paste job description text including key requirements, skills, and expectations..." 
              className="h-[160px]" 
              value={formData.jobdescription}
              onChange={(e) => handleInputChange('jobdescription', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1">Interview Duration</label>
              <Select 
                value={formData.interviewduration} 
                onValueChange={(val) => handleInputChange('interviewduration', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes (Quick Screening)</SelectItem>
                  <SelectItem value="15">15 Minutes (Standard Practice)</SelectItem>
                  <SelectItem value="30">30 Minutes (Deep Technical)</SelectItem>
                  <SelectItem value="45">45 Minutes (System & Behavioral)</SelectItem>
                  <SelectItem value="60">60 Minutes (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1">Focus Areas</label>
              <div className="flex gap-2 flex-wrap">
                {InterviewType.map((type, idx) => {
                  const isSelected = formData.type.includes(type.name);
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleFocusClick(type.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className="h-3.5 w-3.5" />
                      <span>{type.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleGenerateQuestions} 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
            >
              {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              Generate Questions & Preview Matrix
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Question Matrix Review & Edit */}
      {step === 2 && (
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generated Question Matrix</h2>
              <p className="text-xs text-gray-500">Review, add, or customize questions for your mock session.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Edit JD Input
            </Button>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {questionList.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {typeof item === 'string' ? 'Technical' : item.type || 'General'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {typeof item === 'string' ? item : item.question}
                  </p>
                  {item.hint && (
                    <p className="text-xs text-gray-500 italic">Hint: {item.hint}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveQuestion(idx)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add custom question */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
            <h4 className="text-xs font-semibold text-blue-900">Add Custom Question</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                placeholder="Type custom question..." 
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="bg-white"
              />
              <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                <SelectTrigger className="w-full sm:w-40 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                  <SelectItem value="Experience">Experience</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddQuestion} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSaveAndLaunch} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
            >
              {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              Save Session & Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Launch Session Page */}
      {step === 3 && (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Voice Interview Room is Ready!</h2>
            <p className="text-gray-500 text-sm mt-1">
              Target Role: <span className="font-semibold text-gray-800">{formData.jobposition}</span> ({formData.interviewduration} Minutes)
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto text-left text-xs space-y-2 text-gray-600">
            <p className="font-semibold text-gray-800 text-sm">💡 Quick Tips Before Launching:</p>
            <p>• Ensure your microphone is allowed and working cleanly.</p>
            <p>• Speak clearly and concisely when responding to questions.</p>
            <p>• Click End Interview anytime when you finish to get your Feedback Report.</p>
          </div>

          <div className="pt-4">
            <Link href={`/interview/${interviewId}/start`}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg rounded-xl gap-3 shadow-md">
                <Play className="h-6 w-6" /> Launch AI Voice Mock Session Now
              </Button>
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
