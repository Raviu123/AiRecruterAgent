import React from 'react'
import { toast } from 'sonner'



const InterviewCard = ({interview}) => {
    
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
        {/* Header */}
        <div className="flex justify-between items-start">
        {/* Circle Logo Placeholder */}
        <div className="w-6 h-6 rounded-full bg-blue-500"></div>
        {/* Date */}
        <p className="text-sm text-gray-500"> {interview.created_at.substring(0, 10)}</p>
        </div>

        {/* Title */}
        <h2 className='font-semibold text-lg mt-2'>{interview.jobposition}</h2>

        {/* Duration */}
        <p className='text-sm text-gray-500'>{interview.interviewduration} Min </p>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
        <button onClick={()=>copyLink()} className="flex-1 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-100">
            📋 Copy Link
        </button>
        <button onClick={sendEmail}  className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">
            ✉️ Send
        </button>
        </div>
    </div>
  </div>
  )
}

export default InterviewCard