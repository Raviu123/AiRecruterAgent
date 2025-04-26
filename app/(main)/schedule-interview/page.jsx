"use client"
import React from 'react'
import { supabase } from '@/services/supabaseClient';
import { useState,useEffect } from 'react';
import {useUser} from '@/app/provider';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InterviewCard from '../dashboard/_components/InterviewCard';

const ScheduleInterview = () => {

  const {user} = useUser();
  const [interviewList, setInterviewList] = useState();

  useEffect(()=>{
    user && GetInterviewList();
  },[user])

  const GetInterviewList=async()=>{
    let {data:result} = await supabase
            .from('Interviews')
            //.select('jobposition,interviewduration,interview_id,interview-feedback(userEmail)')
            .select('*,interview-feedback(userEmail)')
            .eq('userEmail',user?.email)
            .order('id',{ ascending: false })

            console.log(result)
            setInterviewList(result); 
  }


  return (
    <div className='mt-5'>
      <h2 className='font-bold text-xl'>Interview List with candidate Feedback</h2>

      {interviewList?.length == 0 && (
        <div className="p-5 flex flex-col gap-3 items-center">
            <Video className="h-10 w-10 text-primary" />
            <h2>You don't have any interview created!</h2>
            <Button>+ Create New Interview</Button>
        </div>
        )}
        {interviewList &&
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
                {interviewList.map((interview, index) => (
                <InterviewCard interview={interview} key={index} 
                  viewDetails={true}
                />
                ))}
            </div>
        }
    </div>
  )
}

export default ScheduleInterview