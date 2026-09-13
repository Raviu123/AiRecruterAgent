"use client"
import React, { useEffect, useState, useContext } from 'react'
import Image from 'next/image'
import { Clock, Info, Video, Loader2Icon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import InterviewDataContext from '@/context/interviewDataContext'
import { useUser } from '@/app/provider'
import { getInterview } from '@/modules/mock-interview/mockInterviewService'
import { toast } from 'sonner'

const Interview = () => {
    const { interview_id } = useParams()
    const { user } = useUser()
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

    // Prefill for signed-in users practicing their own interview
    useEffect(() => {
        if (user) {
            setUserName((prev) => prev || user.name || "")
            setUserEmail((prev) => prev || user.email || "")
        }
    }, [user])

    const GetInterviewDetails = async () => {
        setLoading(true)
        try {
            setInterviewData(await getInterview(interview_id))
        } catch (e) {
            console.error("Error fetching interview details:", e)
            toast.error(e.status === 404 ? 'Interview not found or link expired' : `Could not load interview: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    const onJoinInterview = () => {
        setInterviewInfo({
            userName: userName.trim(),
            userEmail: userEmail.trim(),
            interviewData: interviewData
        })
        router.push('/interview/' + interview_id + '/start')
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
                    <Input placeholder="e.g. Alex Johnson" value={userName} onChange={(event) => setUserName(event.target.value)} />
                </div>

                <div className='w-full space-y-2'>
                    <label className="text-sm font-medium text-gray-700 block">Your Email Address:</label>
                    <Input type="email" placeholder="e.g. alex@example.com" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} />
                </div>

                <div className='bg-blue-50 border border-blue-100 p-5 w-full rounded-xl flex gap-4 mt-4'>
                    <Info className='text-blue-500 h-5 w-5 shrink-0 mt-0.5' />
                    <div>
                        <h2 className='font-bold text-blue-900 text-sm'>Before You Begin</h2>
                        <ul className='text-xs text-blue-700 mt-2 space-y-1'>
                            <li>• Ensure a stable internet connection</li>
                            <li>• Test your microphone (or use text practice mode)</li>
                            <li>• Find a quiet room for your voice session</li>
                        </ul>
                    </div>
                </div>

                <Button
                    className='mt-6 w-full font-semibold bg-primary hover:bg-primary/90 text-white gap-2 py-3'
                    disabled={loading || !interviewData || !userName.trim()}
                    onClick={() => onJoinInterview()}
                >
                    {loading ? <Loader2Icon className="animate-spin h-5 w-5" /> : <Video className="h-5 w-5" />}
                    Join Interview Session
                </Button>
            </div>
        </div>
    )
}

export default Interview
