"use client"
import React from 'react'
import { useState } from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LatestInterviewList = () => {
  const [interviewList, setInterviewList] = useState([]);
  return (
    <div className='my-5'>
      <h2 className='font-bold text-2xl'>Previously created Interviews</h2>
      
      {interviewList?.length==0&&
      <div className='bg-white rounded-lg mt-4 p-5 flex flex-col gap-3 items-center '>
        <Video className='h-10 text-primary w-10'/>
        <h2>You dont have any interview created</h2>
        <Button>+ Create New Interview</Button>
      </div>}
    </div>
  )
}

export default LatestInterviewList