import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './components/AppSidebar'

const Dashboardprovider = ({children}) => {
  return (
    <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-h-screen p-6 bg-gray-50 text-gray-900 overflow-y-auto">
            {children}
        </main>
    </SidebarProvider>
  ) 
}

export default Dashboardprovider