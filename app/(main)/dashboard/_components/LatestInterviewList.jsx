"use client"
import React, { use } from 'react'
import { useState,useEffect } from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import { toast } from 'sonner'
import InterviewCard from './InterviewCard';

const LatestInterviewList = () => {
  const [interviewList, setInterviewList] = useState([]);
  const {user} = useUser();
  //console.log("UserEmail: "+user?.email)
  const url = process.env.NEXT_PUBLIC_HOST_URL+'/'+interviewList?.interview?.interview_id;
 
  useEffect(()=>{ 
  user && GetInterviewList();
 },[user])

 


  const GetInterviewList =async()=>{
   console.log("Fetching Interview List")
    let { data: Interviews, error } = await supabase
    .from('Interviews')
    .select('*,interview-feedback(userEmail)')
    .eq('userEmail',user?.email)
    .order('id',{ ascending: false })
    .limit(6)

    console.log(Interviews)
    setInterviewList(Interviews);
  }
  return (
    <div className='my-5'>
      <h2 className='font-bold text-2xl'>Previously created Interviews</h2>
      
      {interviewList?.length==0&&
      <div className='bg-white rounded-lg mt-4 p-5 flex flex-col gap-3 items-center '>
        <Video className='h-10 text-primary w-10'/>
        <h2>You dont have any interview created</h2>
        <Button>+ Create New Interview</Button>
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