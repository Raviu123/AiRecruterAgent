"use client"
import React from 'react'
import { useState,useEffect } from 'react';
import {useUser} from '@/app/provider';
import { toast } from 'sonner'
import { Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import InterviewCard from '../dashboard/_components/InterviewCard';
import { fetchUserInterviews } from '@/modules/mock-interview/mockInterviewService';

const ScheduleInterview = () => {

  const {user} = useUser();
  const [interviewList, setInterviewList] = useState();

  useEffect(()=>{
    user && GetInterviewList();
  },[user])

  const GetInterviewList=async()=>{
    try {
      setInterviewList(await fetchUserInterviews());
    } catch (err) {
      console.error("Error fetching interviews:", err);
      toast.error(`Could not load interviews: ${err.message}`);
    }
  }


  return (
    <div className='mt-5'>
      <h2 className='font-bold text-xl'>Interview List with candidate Feedback</h2>

      {interviewList?.length == 0 && (
        <div className="p-5 flex flex-col gap-3 items-center">
            <Video className="h-10 w-10 text-primary" />
            <h2>You don't have any interview created!</h2>
            <Link href='/mock-interview'><Button>+ Create New Interview</Button></Link>
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
