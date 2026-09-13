import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QuestionListCOntainer from './QuestionListContainer'
import { generateQuestionsFromJD, createInterview } from '@/modules/mock-interview/mockInterviewService'

const QuestionList = ({formData,onCreateLink}) => {

const [loading,setLoaing]  = useState(false);
const [questionList,setQuestionList] = useState();
const [saveloading,setSaveloading] = useState(false);
useEffect(()=>{
    if(formData){
        GenerateQuestinList();
    }
},[formData])

 const GenerateQuestinList=async()=>{
    setLoaing(true);
    try{
        const { questions, source } = await generateQuestionsFromJD(formData);
        if (source !== 'ai') {
            toast.warning("AI generation is unavailable, so generic questions were added.");
        }
        setQuestionList(questions);
    }catch(e){
        console.error("Error generating questions:",e);
        toast.error(`Server Error: ${e.message}`);
    }finally{
        setLoaing(false);
    }
 }

 const onFinish=async()=>{
    setSaveloading(true);
    try{
        const interview = await createInterview({ ...formData, questionList });
        onCreateLink(interview.interview_id);
    }catch(e){
        console.error("Error creating interview:",e);
        toast.error(`Could not create interview: ${e.message}`);
    }finally{
        setSaveloading(false);
    }
 }


  return (
    <div>
        {loading&&
        <div className='p-5 bg-blue-50 rounded-xl border-grey-100 flex gap-5 items-center border border-primary'>
            <Loader2Icon className='animate-spin'/>
            <div>
                <h2 className='font-medium '>Generating Interview Questions</h2>
                <p className='text-pretty'>Our AI is drafting personalised questions based on your job position</p>
            </div>
        </div>}


        {questionList?.length>0&&
            <div>
                <QuestionListCOntainer questionList={questionList}/>
                <div className='flex justify-end items-center gap-5 mt-10'>

                    <Button onClick={()=>onFinish()} disabled={saveloading}>
                        {saveloading&&<Loader2Icon className='animate-spin'/>}
                         Create Interview & Finish</Button>
                </div>
            </div>
        }


    </div>
  )
}

export default QuestionList
