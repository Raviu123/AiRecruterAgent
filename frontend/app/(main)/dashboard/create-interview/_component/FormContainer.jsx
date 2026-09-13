"use client"
import React, { useState, useEffect } from 'react'
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

const FormContainer = ({ OnhandleInputChange = () => {}, GoToNext = () => {} }) => {
  const [interviewtype, setInterviewType] = useState([]);

  useEffect(() => {
    if (interviewtype && interviewtype.length > 0) {
      OnhandleInputChange('type', interviewtype);
    }
  }, [interviewtype]);

  const handleClick = (type) => {
    const isSelected = interviewtype.includes(type);
    if (!isSelected) {
      setInterviewType(prev => [...prev, type]);
    } else {
      const newData = interviewtype.filter((item) => item !== type);
      setInterviewType(newData);
    }
  };

  return (
    <div className='p-5 bg-white rounded-2xl border border-gray-200 shadow-sm'>
        <div>
            <div>   
                <h2 className='text-sm font-medium'>Job Position / Target Role</h2>
                <Input 
                  placeholder="e.g. Fullstack Developer, Data Scientist" 
                  className="mt-2" 
                  onChange={(event) => OnhandleInputChange('jobposition', event.target.value)}
                />
            </div>

            <div className='mt-5'>
                <h2 className='mb-2 text-sm font-medium'>Job Description</h2>
                <Textarea 
                  placeholder="Paste detailed job description or key responsibilities" 
                  className="h-[180px]" 
                  onChange={(event) => OnhandleInputChange('jobdescription', event.target.value)}
                />
            </div>

            <div className='mt-5'>
                <h2 className='mb-2 text-sm font-medium'>Interview Duration</h2>
                <Select onValueChange={(value) => OnhandleInputChange('interviewduration', value)}>
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select Duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5 Minutes</SelectItem>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="45">45 Minutes</SelectItem>
                        <SelectItem value="60">60 Minutes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='mt-5'>
                <h2 className='mb-2 text-sm font-medium'>Interview Focus Areas</h2>
                <div className='flex gap-3 flex-wrap mt-2'>
                    {InterviewType.map((type, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center cursor-pointer gap-2 p-2 px-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all ${
                            interviewtype.includes(type.name) ? 'bg-blue-50 border-blue-500 text-primary font-medium' : ''
                          }`} 
                          onClick={() => handleClick(type.name)}
                        >
                            <type.icon className='h-4 w-4'/>
                            <span>{type.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className='flex justify-end mt-6'>
            <Button onClick={() => GoToNext()} className="gap-2">
                Generate Questions & Continue <ArrowRight className="h-4 w-4"/>
            </Button>
        </div>
    </div>
  )
}

export default FormContainer