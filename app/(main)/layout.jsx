//the folder is (main) because when written inside of a () it is not considered as a route
import React from 'react'
import Dashboardprovider from './provider'
import { AppSidebar } from './components/AppSidebar'

const Dashboardlayout = ({children}) => {
  return (
    <Dashboardprovider>
      <div className="p-10">
          {children}
      </div>
    </Dashboardprovider>   
  )
}

export default Dashboardlayout