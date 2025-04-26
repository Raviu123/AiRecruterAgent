import { Button } from '@/components/ui/button';
import React from 'react'
import { toast } from 'sonner'
import {  MoveRight } from "lucide-react";
import Link from 'next/link';



const InterviewCard = ({interview,viewDetails=false}) => {
    
    const url = process.env.NEXT_PUBLIC_HOST_URL+'/'+interview?.interview_id;
    const copyLink = ()=>{
        navigator.clipboard.writeText(url)
        toast('Copied')
    }


    const sendEmail = () => {
        const subject = `Interview Invitation for ${interview.jobposition} Position`
        const body = `Hello,

            You have been invited for an interview for the ${interview.jobposition} position.

            Please click the following link to start your interview:
            ${url}

            Interview Duration: ${interview.interviewduration} minutes

            Best regards,
            AI Recruiter Team
                    `.trim()

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.location.href = mailtoLink
        toast('Email client opened')
        }

  return (
    <div>
        <div className='bg-white rounded-xl p-4 shadow-md flex flex-col justify-between'>
        <div className="flex justify-between items-start">
        {/* Circle Logo Placeholder */}
        <div className="w-6 h-6 rounded-full bg-blue-500"></div>
        <p className="text-sm text-gray-500"> {new Date(interview.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        })}
        </p>
        </div>

        <h2 className='font-semibold text-lg mt-2'>{interview.jobposition}</h2>
        
        <h2 className='flex justify-between mt-2'>
        <p className='text-sm text-gray-500'>{interview.interviewduration} Min </p>
        
        <span className={`font-bold text-sm ${interview['interview-feedback']?.length>0?'text-green-500':'text-gray-500'}`}>{interview['interview-feedback']?.length} Candidates </span>
        </h2>
        

        {!viewDetails ? <div className="flex gap-2 mt-4">
            <button onClick={()=>copyLink()} className="flex-1 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-100">
                📋 Copy Link
            </button>
            <button onClick={sendEmail}  className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">
                ✉️ Send
            </button>
        </div>
        :
        <Link href={"/schedule-interview/"+interview?.interview_id+"/details"} >   
        <Button className="mt-5 w-full " variant="outline">View Detail <MoveRight/></Button>
        </Link> 
        }
    </div>
  </div>
  )
}

export default InterviewCard