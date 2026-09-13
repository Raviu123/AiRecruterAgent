"use client"
import React from 'react'
import { Video, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CreateOptions = () => {
  const router = useRouter();
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <div 
          className='bg-white border border-gray-200 hover:border-primary transition-all shadow-sm rounded-lg p-5 cursor-pointer' 
          onClick={() => router.push('/mock-interview')}
        >
            <Video className="h-12 w-12 p-3 text-primary bg-blue-50 rounded-lg mb-2"/>
            <h2 className='font-bold text-lg'>Start JD Mock Interview</h2>
            <p className='text-gray-500 text-sm'>Upload or paste target Job Description and practice dynamic AI voice interview.</p>
        </div>
        <div 
          className='bg-white border border-gray-200 hover:border-primary transition-all shadow-sm rounded-lg p-5 cursor-pointer' 
          onClick={() => router.push('/aptitude')}
        >
            <Brain className="h-12 w-12 p-3 text-primary bg-purple-50 rounded-lg mb-2"/>
            <h2 className='font-bold text-lg'>Aptitude Playground</h2>
            <p className='text-gray-500 text-sm'>Practice quantitative, reasoning, and verbal aptitude tests from ingested book databases.</p>
        </div>
    </div>
  )
}

export default CreateOptions