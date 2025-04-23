"use client"
import React, { useContext, useState,useEffect } from 'react'
import InterviewDataContext from '@/context/interviewDataContext'
import {Timer,Mic,Phone} from 'lucide-react'
import Image from 'next/image'
import Vapi from "@vapi-ai/web";
import AlertConfiirmation from './_components/AlertConfiirmation'



const StartInterview = () => {
  
  const {interviewInfo,setInterviewInfo} = useContext(InterviewDataContext)
  const [activeUser,setActiveUser] = useState(false)

  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

  useEffect(()=>{
    interviewInfo&& stratCall();
  },[interviewInfo])

  let questionList;

  const stratCall = ()=>{
    if(interviewInfo){
      
      interviewInfo?.interviewData?.questionList.forEach((item,index)=>{
        questionList = item?.question + ','+ questionList;
      });

      //console.log(questionList);
    }

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: "Hi "+interviewInfo?.userName+", how are you? Ready for your interview on "+interviewInfo?.interviewData?.jobPosition+"?",
      transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
      },
      voice: {
          provider: "playht",
          voiceId: "jennifer",
      },
      model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
              {
                  role: "system",
                  content: `
    You are an AI voice assistant conducting interviews.
  Your job is to ask candidates provided interview questions, assess their responses.
  Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
  "Hey there! Welcome to your `+interviewInfo?.interviewData?.jobPosition+` interview. Let’s get started with a few questions!"
  Ask one question at a time and wait for the candidate’s response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
  Questions: `+questionList+`
  If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
  "Need a hint? Think about how React tracks component updates!"
  Provide brief, encouraging feedback after each answer. Example:
  "Nice! That’s a solid answer."
  "Hmm, not quite! Want to try again?"
  Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let’s tackle a tricky one!"
  After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
  "That was great! You handled some tough questions well. Keep sharpening your skills!"
  End on a positive note:
  "Thanks for chatting! Hope to see you crushing projects soon!"
  Key Guidelines:
  ✅ Be friendly, engaging, and witty 🎤
  ✅ Keep responses short and natural, like a real conversation
  ✅ Adapt based on the candidate’s confidence level
  ✅ Ensure the interview remains focused on React
  `.trim(),
              },
          ],
      },
    };
  
      vapi.start(assistantOptions)
      console.log('interview started')
  }


  const stopInterview=()=>{
    vapi.stop()
    console.log('interview stopped')
  }


  vapi.on("call-start", () => {
    console.log("Call has started.");
    toast("Call Connected...");
  });
  

  vapi.on("speech-start", () => {
    console.log("Assistant speech has started.");
    setActiveUser(false)
  });

  vapi.on("speech-end", () => {
    console.log("Assistant speech has ended.");
    setActiveUser(true)
  });

  vapi.on("call-end", () => {
    console.log("Call has ended.");
    toast('Interview Ended');
  });
  
  
  

  return (
    <div className='p-20 lg:px-48 xl:px-56 bg-gray-200'>
      <h2 className='font-bold text-xl flex justify-between'>AI Interview Session
        <span className='flex gap-2 items-center'>
          <Timer></Timer>00:00:00
        </span>
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
        <div className='bg-white h-[400px] p-20 rounded-lg border flex  flex-col gap-3 items-center justify-center'>
          <div className='relative'>
            {!activeUser && <span className='absolute inset-0 rounded-full bg-blue-500 oacity-75 animate-ping'/>}
            <Image src={'/ai.jpg'} alt="interviewer" width={100} height={100} className='w-[60px] h-[60px] rounded-full object-center'></Image>
          </div>
          <h2>AI Recruter</h2>
        </div>

        <div className='bg-white h-[400px] p-20 rounded-lg border  items-center justify-center flex  flex-col gap-3'>
          <div className='relative'>
            {!activeUser && <span className='absolute inset-0 rounded-full bg-blue-500 oacity-75 animate-ping'/>}
            <h2 className='text-2xl bg-primary text-white p-5 rounded-full px-7'>{interviewInfo?.userName[0]}</h2>
          </div>
          <h2>{interviewInfo?.userName}</h2>
        </div>
      </div>

      <div className='flex items-center justify-center gap-5 mt-8'>
        <Mic className='text-white h-10 w-10 p-3 bg-gray-500 cursor-pointer rounded-full'></Mic>
        
        {/** Here we are wrapping the phone inside of allert componet, that means the phone is now the child componet of the alert comp,in alert comp we have declared the functionality to be applied to all the children isomg {children} */}
        <AlertConfiirmation stopInterview={()=>stopInterview()}>
          <Phone className='text-white h-10 w-10 p-3 bg-red-500 cursor-pointer rounded-full'></Phone>
        </AlertConfiirmation>
        
      </div>
      <h2 className='text-sm text-gray-400 text-center mt-5'>Interview in Progress....</h2>
      
    </div>
  )
}

export default StartInterview