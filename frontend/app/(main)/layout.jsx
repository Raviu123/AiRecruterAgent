import React from 'react'
import Dashboardprovider from './provider'

const Dashboardlayout = ({children}) => {
  return (
    <Dashboardprovider>
      {children}
    </Dashboardprovider>   
  )
}

export default Dashboardlayout