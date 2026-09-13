import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './components/AppSidebar'
import AuthGuard from './components/AuthGuard'

const Dashboardprovider = ({children}) => {
  return (
    <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-2 mb-4 md:hidden">
              <SidebarTrigger />
              <span className="font-semibold text-sm text-gray-700">Menu</span>
            </div>
            <AuthGuard>{children}</AuthGuard>
        </SidebarInset>
    </SidebarProvider>
  ) 
}

export default Dashboardprovider