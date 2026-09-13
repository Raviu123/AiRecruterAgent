import { LayoutDashboard, Briefcase, Brain, List, Settings } from "lucide-react"
import {
   Code,
   UserCheck,
   BadgeCheck,
} from "lucide-react";

export const SidebarOptions = [
    {
       name: "Dashboard",
       icon: LayoutDashboard, 
       path:'/dashboard',
    },
    {
        name: "JD Mock Interview",
        icon: Briefcase,
        path:'/mock-interview',
     },
     {
        name: "Aptitude Playground",
        icon: Brain, 
        path:'/aptitude',
     },
     {
        name: "Analytics & History",
        icon: List, 
        path:'/analytics',
     },
     {
        name: "Settings",
        icon: Settings, 
        path:'/settings',
     },
]

export const InterviewType = [
   {
     name: "Technical",
     icon: Code,
   },
   {
     name: "Behavioural",
     icon: UserCheck,
   },
   {
     name: "Leadership",
     icon: BadgeCheck,
   },
   {
     name: "Experience",
     icon: Briefcase,
   },
   {
     name: "Problem Solving",
     icon: Brain,
   },
];

// AI prompts (question generation, feedback grading, voice interviewer) live in backend/app/prompts.py
