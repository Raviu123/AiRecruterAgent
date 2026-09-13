"use client"
import { useParams } from 'next/navigation'
import React from 'react'
import { useState,useEffect } from 'react';
import { toast } from 'sonner'
import {useUser} from '@/app/provider';
import InterviewDetailContainer from './_components/InterviewDetailContainer';
import CandidateList from './_components/CandidateList';
import { getInterviewDetails } from '@/modules/mock-interview/mockInterviewService';

const InterviewDetails = () => {

    const {interview_id} = useParams();
    const {user} = useUser()
    const [interviewDetails, setInterviewDetails] = useState();

    useEffect(() => {
        user && GetIntervieDetails()
    },[user])


    const GetIntervieDetails = async () => {
        try {
            setInterviewDetails(await getInterviewDetails(interview_id));
        } catch (err) {
            console.error("Error fetching interview details:", err);
            toast.error(`Could not load interview: ${err.message}`);
        }
    };

  return (
    <div className='mt-5'>
        <h2 className='font-bold text-2xl'>Interview Details</h2>
        <InterviewDetailContainer interviewDetails={interviewDetails}/>
        <CandidateList candidateList={interviewDetails?.['interview-feedback']}/>
    </div>
  )
}

export default InterviewDetails
