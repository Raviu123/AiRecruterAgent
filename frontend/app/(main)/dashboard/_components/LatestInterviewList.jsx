"use client"
import React from 'react'
import { useState,useEffect } from 'react';
import { Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/app/provider';
import { toast } from 'sonner'
import InterviewCard from './InterviewCard';
import { fetchUserInterviews } from '@/modules/mock-interview/mockInterviewService';

const LatestInterviewList = () => {
  const [interviewList, setInterviewList] = useState([]);
  const {user} = useUser();

  useEffect(()=>{
  user && GetInterviewList();
 },[user])

  const GetInterviewList =async()=>{
    try {
      setInterviewList(await fetchUserInterviews({ limit: 6 }));
    } catch (err) {
      console.error("Error fetching interviews:", err);
      toast.error(`Could not load interviews: ${err.message}`);
    }
  }
  return (
    <div className='my-5'>
      <h2 className='font-bold text-2xl'>Previously created Interviews</h2>

      {interviewList?.length==0&&
      <div className='bg-white rounded-lg mt-4 p-5 flex flex-col gap-3 items-center '>
        <Video className='h-10 text-primary w-10'/>
        <h2>You dont have any interview created</h2>
        <Link href='/mock-interview'><Button>+ Create New Interview</Button></Link>
      </div>}

      {interviewList &&
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
        {interviewList.map((interview, index) => (
          <InterviewCard interview={interview} key={index} />
        ))}
      </div>
    }


    </div>
  )
}

export default LatestInterviewList
