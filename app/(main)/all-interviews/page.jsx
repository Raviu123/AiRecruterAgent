"use client"
import React, { use } from 'react'
import { supabase } from '@/services/supabaseClient';
import { useState,useEffect } from 'react';
import InterviewCard from '../dashboard/_components/InterviewCard';
import { useUser } from '@/app/provider';
import { toast } from 'sonner'

const AllInterview = () => {
    const [interviewList, setInterviewList] = useState([]);
    const {user} = useUser();
    
    useEffect(()=>{ 
        user && GetInterviewList();
       },[user])


    const GetInterviewList =async()=>{
       console.log("Fetching Interview List")
        let { data: Interviews, error } = await supabase
        .from('Interviews')
        .select('*')
        .eq('userEmail',user?.email)
        .order('id',{ ascending: false })
        
    
        console.log(Interviews)
        setInterviewList(Interviews);
      }

  return (
    <div>
        <h2 className='font-bold text-2xl'>All Previously Created Interviews</h2>
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

export default AllInterview