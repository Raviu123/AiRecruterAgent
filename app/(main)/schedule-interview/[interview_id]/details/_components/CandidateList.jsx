"use client"
import { Button } from '@/components/ui/button';
import React from 'react'
import { useUser } from '@/app/provider';
import Image from 'next/image'
import CandidateFeedbackDialog from './CandidateFeedbackDialog'; 

const CandidateList = ({candidateList}) => {

    console.log("Candidate List:", candidateList); // <- log the candidate list
    const {user} = useUser();
  return (
    <div className='mt-5 '>
        {candidateList?.length>0 && <h2 className=' font-bold'>Candidate List</h2>}
        {candidateList?.map((candidate,index)=>(
            <div key={index} className="bg-white rounded-xl p-5 flex gap-3 items-center justify-between mt-2">
            <div className="flex items-center gap-5">
            <h2 className='rounded-full bg-blue-700 flex justify-center items-center p-5 w-5 h-5 text-white font-bold '>{candidate.userName[0]}</h2>
                <div>
                  <h2 className="font-bold">{candidate?.userName}</h2>
                  <h2 className="text-sm text-gray-500">Completed On:{ new Date(candidate?.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })} </h2>
                </div>

            </div>
          
            <div className="flex gap-3 items-center">
              <h2 className="text-green-600">6/10</h2>
              <CandidateFeedbackDialog candidate={candidate}/>
            </div>
          </div>
        ))}
    </div>
  )
}

export default CandidateList