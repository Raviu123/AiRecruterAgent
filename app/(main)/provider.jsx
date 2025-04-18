import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './components/AppSidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import WelcomeContainer from './dashboard/_components/WelcomeContainer'

const Dashboardprovider = ({children}) => {
  return (
    <SidebarProvider>
        <AppSidebar />
          <div className="w-full">
            {/*<SidebarTrigger />*/}
            <WelcomeContainer/>
            {children}
          </div>
    </SidebarProvider>
  ) 
}

export default Dashboardprovider