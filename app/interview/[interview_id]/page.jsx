"use client"
import React, { useEffect, useState, useContext } from 'react'
import Image from 'next/image'
import { Clock, Info, Video, Loader2Icon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import InterviewDataContext from '@/context/interviewDataContext'
import { toast } from 'sonner'

const Interview = () => {
    const { interview_id } = useParams()
    const [interviewData, setInterviewData] = useState()
    const [userName, setUserName] = useState("") 
    const [userEmail, setUserEmail] = useState("") 
    const [loading, setLoading] = useState(false) 
    const { setInterviewInfo } = useContext(InterviewDataContext)
    const router = useRouter()

    useEffect(() => {
        if (interview_id) {
            GetInterviewDetails()
        }
    }, [interview_id])

    const GetInterviewDetails = async () => {
        setLoading(true)
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select("jobposition,jobdescription,interviewduration,type")
                .eq('interview_id', interview_id)

            if (Interviews && Interviews.length > 0) {
                setInterviewData(Interviews[0])
            } else {
                toast.error('Interview not found or link expired')
            }
            setLoading(false)
        } catch (e) {
            console.error("Error fetching interview details:", e)
            toast.error('Incorrect Interview Link')
            setLoading(false)
        }
    }

    const onJoinInterview = async () => {
        setLoading(true)
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select("*")
                .eq('interview_id', interview_id)

            setInterviewInfo({
                userName: userName,
                userEmail: userEmail,
                interviewData: Interviews?.[0] || interviewData
            })
            router.push('/interview/' + interview_id + '/start')
        } catch (err) {
            console.error("Error joining interview:", err)
            toast.error("Failed to join interview. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='px-6 md:px-28 lg:px-48 xl:px-64 mt-8 mb-10'> 
            <div className='p-7 lg:px-20 xl:px-32 flex flex-col items-center justify-center border border-gray-200 rounded-xl bg-white shadow-sm space-y-4'>
                <Image src={'/logo.png'} alt='logo' width={120} height={40} className="w-[120px] h-auto" />
                <h2 className='text-gray-600 text-sm font-medium'>AI Powered Interview Preparation</h2>
                <Image src={'/interview.png'} alt="interview" width={220} height={180} className="rounded-lg" />
                
                <h2 className='font-bold text-2xl text-gray-900'>{interviewData?.jobposition || 'Mock'} Interview</h2>
                <h2 className='flex gap-2 items-center text-gray-500 text-sm'>
                    <Clock className='h-4 w-4'/> {interviewData?.interviewduration || 15} Minutes
                </h2>

                <div className='w-full space-y-2 mt-4'>
                    <label className="text-sm font-medium text-gray-700 block">Your Full Name:</label>
                    <Input placeholder="e.g. Alex Johnson" onChange={(event) => setUserName(event.target.value)} />
                </div>

                <div className='w-full space-y-2'>
                    <label className="text-sm font-medium text-gray-700 block">Your Email Address:</label>
                    <Input placeholder="e.g. alex@example.com" onChange={(event) => setUserEmail(event.target.value)} />
                </div>

                <div className='bg-blue-50 border border-blue-100 p-5 w-full rounded-xl flex gap-4 mt-4'>
                    <Info className='text-blue-500 h-5 w-5 shrink-0 mt-0.5' />
                    <div>
                        <h2 className='font-bold text-blue-900 text-sm'>Before You Begin</h2>
                        <ul className='text-xs text-blue-700 mt-2 space-y-1'>
                            <li>• Ensure a stable internet connection</li>
                            <li>• Test your camera and microphone</li>
                            <li>• Find a quiet room for your voice session</li>
                        </ul>
                    </div>
                </div>

                <Button 
                    className='mt-6 w-full font-semibold bg-primary hover:bg-primary/90 text-white gap-2 py-3' 
                    disabled={loading || !userName}
                    onClick={() => onJoinInterview()}
                >
                    {loading ? <Loader2Icon className="animate-spin h-5 w-5" /> : <Video className="h-5 w-5" />} 
                    Join Voice Interview Session
                </Button>
            </div>
        </div>
    )
}

export default Interview