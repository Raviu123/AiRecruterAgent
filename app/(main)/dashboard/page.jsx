import React from 'react'
import WelcomeContainer from './_components/WelcomeContainer'
import CreateOptions from './_components/CreateOptions'
import LatestInterviewList from './_components/LatestInterviewList'

const Dashboard = () => {
  return (
    <div className='space-y-6'>
      <WelcomeContainer/>
      <h2 className='font-bold text-2xl'>Candidate Preparation Hub</h2>
      <CreateOptions></CreateOptions>
      <LatestInterviewList/>
    </div> 
  )
}

export default Dashboard