"use client"
import React from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { supabase } from '@/services/supabaseClient'

const page = () => {
  /**
   * Sign in with Google using Supabase
   */
  console.log("Google sign in page loaded")
  const signInwithGoogle = async () => {
    const {error} = await supabase.auth.signInWithOAuth({
      provider: "google"
    });
    if(error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white rounded-xl shadow-2xl overflow-hidden'>
          <div className='p-6'>
            <Image 
              src='/newlogo.png' 
              width={200} 
              height={100} 
              alt="Logo"
              className=' rounded-t-lg'
              priority
            />
            <div className='flex flex-col items-center space-y-6 mt-8'>
              <Image 
                src='/login.png' 
                width={400} 
                height={250} 
                alt="Login illustration"
                className='w-full h-auto'
                priority
              />
              <h2 className='text-3xl font-bold text-gray-900'>
                Welcome to AI Recruiter
              </h2>
              <p className='text-gray-600 text-lg'>
                Sign in with Google to continue
              </p>
              <Button onClick={signInwithGoogle} className='w-full max-w-xs py-2 px-4 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white transition duration-200'>
                Login with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page