"use client"
import { useParams } from 'next/navigation'
import React, { use } from 'react'
import { supabase } from '@/services/supabaseClient';
import { useState,useEffect } from 'react';
import {useUser} from '@/app/provider';
import InterviewDetailContainer from './_components/InterviewDetailContainer';
import CandidateList from './_components/CandidateList';
const InterviewDetails = () => {
  
    const {interview_id} = useParams();
    const {user} = useUser()
    const [interviewDetails, setInterviewDetails] = useState();
    
    useEffect(() => {
        user && GetIntervieDetails()
    },[user])


    const GetIntervieDetails = async () => {
        let {data: result} = await supabase
            .from('Interviews')
            .select('*,interview-feedback(userEmail,userName,feedback,created_at)')
            .eq('interview_id', interview_id)
            .eq('userEmail', user?.email);
    
        setInterviewDetails(result[0]);
        console.log("Fetched Data:", result[0]);  // <- log the fetched data directly
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