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
     icon: Code, // Representing coding/technical skill
   },
   {
     name: "Behavioural",
     icon: UserCheck, // Representing interpersonal/behavioral assessment
   },
   {
     name: "Leadership",
     icon: BadgeCheck, // Represents authority/leadership role
   },
   {
     name: "Experience",
     icon: Briefcase, // Work experience / professional background
   },
   {
     name: "Problem Solving",
     icon: Brain, // Thinking/problem solving capability
   },
 ];

export const QUESTION_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:
Job Title: {{jobTitle}}
Job Description: {{jobDescription}}
Interview Duration: {{duration}}
Interview Type: {{type}}

🧠 Your task:
Analyze the job description to identify key responsibilities, required skills, and expected experience.
Generate a list of interview questions depends on interview duration
Adjust the number and depth of questions to match the interview duration.
Ensure the questions match the tone and structure of a real-life {{type}} interview.
Make sure to keep some questions long and some short, depending on the interview duration.
🟢 Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
question:"",
type:'Technical/Behavioral/Experince/Problem Solving/Leaseship'
},{
..
}
]}

🎯 The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobTitle}} role.`
 


export const FEEDBACK_PROMPT = `{{conversation}}

Depends on this Interview Conversation between assitant and user, 

Give me feedback for user interview. Give me rating out of 10 for technical Skills, 

Communication, Problem Solving, Experince. Also give me summery in 3 lines 

about the interview and one line to let me know whether is recommanded 

for hire or not with msg. Give me response in JSON format

{

    feedback:{

        rating:{

            techicalSkills:5,

            communication:6,

            problemSolving:4,

            experince:7

        },

        summery:<in 3 Line>,

        Recommendation:'',

        RecommendationMsg:''



    }

}

`