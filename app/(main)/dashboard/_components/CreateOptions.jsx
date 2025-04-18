"use client"
import React from 'react'
import { Video ,Phone} from 'lucide-react'
import { useRouter } from 'next/navigation'



const CreateOptions = () => {
  const router = useRouter();
  return (
    <div className='grid grid-cols-2 gap-5'>
        <div className='bg-white border-grey-200 rounded-lg p-5 cursor-pointer' onClick={()=>router.push('/dashboard/create-interview')}>
            <Video className="h-12 w-12 p-3 text-primary bg-blue-50 rounded-lg"/>
            <h2 className='font-bold'>Create New Interview</h2>
            <p className='text-gray-500 '>Create Ai Interview and Schedulethen with cnadidates </p>
        </div>
        <div className='bg-white border-grey-200 rounded-lg p-5'>
            <Phone className="h-12 w-12 p-3 text-primary bg-blue-50 rounded-lg"/>
            <h2 className='font-bold'>Create Phone Screening call</h2>
            <p className='text-gray-500 '>Schedule Phone screening call with candidates </p>
        </div>
    </div>
  )
}

export default CreateOptions