"use client"
import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"
import { useState } from 'react'
import FormContainer from './_component/FormContainer'

const CreateInterview = () => {
  const router = useRouter();
  const [step,setStep] = useState(1);

  return (
    <div className='mt-10 px-10 md:px-24 lg:px-44 xl:px-56'>
        <div className='flex gap-5 items-center'>
            <ArrowLeft onClick={()=>router.back()} className='cursor-pointer'/>
            <h2 className='font-bold  text-2xl'>create New Interview</h2>
            

        </div>
        <Progress value={step* 33.33}  className="my-5"/>
        <FormContainer/>
    </div>
  )
}

export default CreateInterview