import React from 'react'
import Image from 'next/image'
const InterviewHeader = () => {
  return (
    <div className='p-2 w-full shadow-sm  bg-white'>
        <Image src={'/logo.png'} alt='logo' width={120} height={100} className=''/>
    </div>
  )
}

export default InterviewHeader