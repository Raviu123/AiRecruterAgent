import { Calendar, Clock, TagIcon ,CircleHelp } from 'lucide-react';
import React from 'react';

const InterviewDetailContainer = ({ interviewDetails }) => {
    console.log("Interview Details in details page:", interviewDetails); 

    // Safely parse type
    let parsedType = [];
    try {
        parsedType = JSON.parse(interviewDetails?.type || "[]");
    } catch (error) {
        console.error("Failed to parse type:", error);
    }

    return (
        <div className='p-5 bg-white rounded-lg mt-5'>
            {/* Job Position */}
            <h2 className='text-xl font-bold'>{interviewDetails?.jobposition}</h2>

            {/* Details (Duration, Created On, Type) */}
            <div className='mt-4 flex flex-wrap items-center justify-between gap-4'>
                <div>
                    <h2 className='text-sm text-gray-500'>Duration</h2>
                    <h2 className='flex text-sm font-bold items-center gap-3'>
                        <Clock className='h-4 w-4' /> {interviewDetails?.interviewduration} Minutes
                    </h2>
                </div>

                <div>
                    <h2 className='text-sm text-gray-500'>Created On</h2>
                    <h2 className='flex text-sm font-bold items-center gap-3'>
                        <Calendar className='h-4 w-4' />
                        {interviewDetails?.created_at && new Date(interviewDetails?.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </h2>
                </div>

                <div>
                    <h2 className='text-sm text-gray-500'>Type</h2>
                    <h2 className='flex text-sm font-bold items-center gap-3'>
                        <TagIcon className='h-4 w-4' /> 
                        {parsedType.join(' + ')}
                    </h2>
                </div>
            </div>

            {/* Job Description */}
            <div className='mt-8'>
                <h2 className='text-md font-bold mb-2'>Job Description</h2>
                <p className='text-gray-700 text-sm leading-relaxed'>
                    {interviewDetails?.jobdescription}
                </p>
            </div>

            {/* Interview Questions */}
            <div className='mt-8'>
                <h2 className='text-md font-bold mb-4'>Interview Questions</h2>
                <div className='grid grid-col-2 gap-3 mt-3'>
                    {interviewDetails?.questionList?.map((item, index) => (
                            <h2 key={index} className='flex text-xs'>
                                {index + 1}. {item?.question}
                            </h2>
                    ))}
                </div>
                    
            </div>
        </div>
    );
};

export default InterviewDetailContainer;
