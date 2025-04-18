"use client"
import React from 'react'
import { useUser } from '@/app/provider'
import Image from 'next/image'

const WelcomeContainer = () => {
 const {user} = useUser();
  return (
    <div className='ml-9 mr-9 mt-9 flex justify-between bg-white rounded-2xl items-center'>
        <div className=' w-full g-3   p-5'>
            <h2 className='text-lg font-bold'> Welcome back {user?.name}</h2>
            <h2 className='text-grey-500'>AI Driven Interview , Hassel free Hiring</h2>   
        </div>
        {user&&<Image src={user?.picture} alt="userpic" width={40} height={40} className='mr-4 rounded-full'></Image>}
    </div>
  )
}

export default WelcomeContainer