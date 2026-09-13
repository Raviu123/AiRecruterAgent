"use client"
import React from 'react'
import InterviewHeader from './_components/InterviewHeader'
import interviewDataContext from '@/context/interviewDataContext' //importing the context to use it in the layout
import { useState } from 'react' //importing the useState hook to manage the state of the interview data
const Interviewlayout = ({children}) => {
  const [interviewInfo,setInterviewInfo] = useState() 
  return (
    <interviewDataContext.Provider value={{interviewInfo,setInterviewInfo}}>
    <div>
        <InterviewHeader/>
        {children}
    </div>
    </interviewDataContext.Provider>
  )
}

export default Interviewlayout