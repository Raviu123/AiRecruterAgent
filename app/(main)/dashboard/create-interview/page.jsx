"use client"
import React, { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"
import { useState } from 'react'
import FormContainer from './_component/FormContainer'
import QuestionList from './_component/QuestionList'
import { toast } from "sonner"
import InterviewLink from './_component/interviewLink'    

const CreateInterview = () => {
  const router = useRouter();
  const [step,setStep] = useState(1);
  const [interviewid, setInterviewid] =useState();

  const [formData, setFormData] = useState();
  const OnhandleInputChange = (field, value) => {
      setFormData(prev => ({
          ...prev,
          [field]: value
      }));

      console.log("Updated formData:", {
          ...formData,
          [field]: value
      });
  };

  const onGoToNext = () => {
    if(formData?.jobposition=="" || formData?.jobdescription=="" || formData?.interviewduration=="" || formData?.type==""){
      toast("Please enter all the details")
      return;
    }else{
      setStep(step+1)
    }
  }
  const onCreateLink = (interview_id) => {
    setInterviewid(interview_id);
    setStep(step+1);  
  }

  return (
    <div className='mt-10 px-10 md:px-24 lg:px-44 xl:px-56'>
        <div className='flex gap-5 items-center'>
            <ArrowLeft onClick={()=>router.back()} className='cursor-pointer'/>
            <h2 className='font-bold  text-2xl'>create New Interview</h2>
            

        </div>
        {/* 
      So how we want the page to work is:
      - In this page, there is a progress bar with 3 steps.
      - When we click on the next button, we go to the next step, and the progress bar updates.
      - The page stays the same; only the components change.
    */}
        <Progress value={step* 33.33}  className="my-5"/>
        {step==1 ?< FormContainer OnhandleInputChange={OnhandleInputChange} GoToNext={()=>onGoToNext()}/> 
        :step==2 ? <QuestionList formData={formData} onCreateLink={onCreateLink}/>
        :step==3? <InterviewLink interview_id={interviewid} 
        formData={formData}/>:null}

        
    </div>
  )
}

export default CreateInterview