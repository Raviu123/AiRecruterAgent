import { LayoutDashboard } from "lucide-react"
import { Calendar } from "lucide-react"
import { List } from "lucide-react"
import { WalletCards } from "lucide-react"
import { Settings } from "lucide-react"

export const SidebarOptions = [
    {
       name: "Dashboard",
       icon: LayoutDashboard, 
       path:'/dashboard',
    },
    {
        name: "Schedule Interview",
        icon: Calendar,
        path:'/schedule-interview',
     },
     {
        name: "All interviews",
        icon: List, 
        path:'/all-interviews',
     },
     {
        name: "Billing",
        icon: WalletCards, 
        path:'/billing',
     },
     {
        name: "Settings",
        icon: Settings, 
        path:'/settings',
     },
    
]

export const InterviewType = [
   {
      name: "Dashboard",
      icon: LayoutDashboard,
   },
   {
       name: "Schedule Interview",
       icon: Calendar
    },
    {
       name: "All interviews",
       icon: List
    },
    {
       name: "Billing",
       icon: WalletCards
    },
    {
       name: "Settings",
       icon: Settings
    },
    
   
]