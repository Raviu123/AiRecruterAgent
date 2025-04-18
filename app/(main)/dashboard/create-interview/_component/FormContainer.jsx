import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InterviewType } from '@/services/Constants'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
  

const FormContainer = () => {
  return (
    <div className='p-5 bg-white rounded-2xl'>
        <div>
            <div>   
                <h2 className='text-sm font-medium'>Job Position</h2>
                <Input placeholder="eg. Fullstack Developer" className="mt-2"/>
            </div>

            <div className='mt-5'>
                <h2 className=' mb-2 text-sm font-medium'>Job Description</h2>
                <Textarea placeholder="Enter detailed job description" className="h-[200px]"/>
            </div>

            <div className='mt-5'>
                <h2 className=' mb-2 text-sm'>Interview Duriation</h2>
                <Select>
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Duriation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                    </Select>

            </div>
            
            <div className='mt-5'>
                <h2 className=' mb-2 text-sm font-medium'>Job Description</h2>
                <Textarea placeholder="Enter detailed job description" className="h-[200px]"/>
            </div>

            <div className='mt-5'>
                <h2 className=' mb-2 text-sm font-medium'>Interview Type</h2>
                <div className='flex  gap-3 flex-wrap mt-2'>
                    {InterviewType.map((type,index)=>(
                        <div key={index} className='flex items-center cursor-pointer gap-2  p-1 px-2 border-1 border-gray-300 rounded-2xl hover:bg-secondary '>
                            <type.icon className='h-4 w-4'/>
                            <span>{type.name}</span>
                        </div>
                    ))}
                </div>
            </div>


        </div>
        <div className='flex justify-end mt-5'>
            <Button>Generate Question <ArrowRight/></Button>
        </div>
        
    </div>
  )
}

export default FormContainer