"use client"
import React, { useEffect,useState,useContext } from 'react'
import Image from 'next/image'
import {Clock , Info , Video} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation' //useParams
import { supabase } from '@/services/supabaseClient' //supabase client to connect to the database
import InterviewDataContext from '@/context/interviewDataContext'
import { useRouter } from 'next/navigation'
import { Loader2Icon } from 'lucide-react'


const Interview = () => {
    const {interview_id} = useParams() //useParams will give the interview_id from the url
    console.log(interview_id)

    const [interviewData, setInterviewData] = useState();
    const [userName, setUserName] = useState() 
    const[loading,setLoading]= useState(false) //loading state to show the loading spinner
    const {interviewInfo,setInterviewInfo} = useContext(InterviewDataContext) //using the context to get the interview data, this component is wrapped in intervieInfo provider,(in layout)
    const router = useRouter();

     
    useEffect(()=>{
        interview_id&&GetInterviewDetails() //if interview_id is present then call the function to get the interview details
    },[interview_id])

    const GetInterviewDetails = async ()=>{
        setLoading(true)
        try{
            let { data: Interviews, error } = await supabase
            .from('Interviews')
            .select("jobposition,jobdescription,interviewduration,type")
            .eq('interview_id', interview_id)

        setInterviewData(Interviews[0]) //set the interview data to the state
            console.log(Interviews[0])
        setLoading(false)
        }catch(e){
           toast('Incorrect Interview Link')
            setLoading(false)
        }
        
    }

    const onJoinInterview = async ()=>{
        setLoading(true)
        let { data: Interviews, error } = await supabase
        .from('Interviews')
        .select("*")
        .eq('interview_id', interview_id)


        setInterviewInfo({
            userName: userName,
            interviewData:Interviews[0]  
        }) //set the interview data to the context
        router.push('/interview/'+interview_id+'/start') //push the user to the video page
        setLoading(false)

    }

  return (
    <div className='px-10 md:px-28 lg:px-48 xl:px-64 mt-5 mb-10'> 
        <div className='p-7 lg:px-33 xl:px-52 flex flex-col items-center justify-center border rounded-xl bg-white'>
            <Image src={'/logo.png'} alt='logo' width={100} height={100}/>
            <h2 className='mt-3'>AI powered Interview Platform</h2>
            <Image  src={'/interview.png'} alt="interview" width={250} height={200}></Image>
            <h2 className='font-bold text-xl '>{interviewData?.jobposition} Interview</h2>
            <h2 className='flex gap-2 items-center text-grey-500'><Clock className='h-4 w-4 mt-3'/> {interviewData?.interviewduration} Minutes</h2>

            <div className='w-full'>
                <h2>Enter your full name:</h2>
                <Input placeholder="eg. Rahul " onChange={(event)=>setUserName(event.target.value)}></Input>
            </div>

            <div className='bg-blue-100 p-5 mt-5  rounded-xl flex gap-4'>
                <Info className='text-grey-400'></Info>
                <div>
                <h2 className='font-bold '>Before you begin</h2>
                <ul className='text-sm text-blue-500 mt-2'>
                    <li>- Ensure you have stable internet connection</li>
                    <li>- Test your camera and microphone</li>
                    <li>- Find a quiet place to sit for interview</li>
                </ul>
            </div>
                
            </div>
            <Button className={'mt-5 w-full font-bold'} 
            disabled={loading || !userName}
            onClick={()=>onJoinInterview()}>
                <Video></Video> {loading&&<Loader2Icon/>}  Join Interview</Button>
        </div>
    </div>
  )
}

export default Interview