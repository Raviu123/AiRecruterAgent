import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QuestionListCOntainer from './QuestionListContainer'
import { supabase } from '@/services/supabaseClient'
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/app/provider'

const QuestionList = ({formData,onCreateLink}) => {

const [loading,setLoaing]  = useState(false);
const [questionList,setQuestionList] = useState();
const {user} = useUser();
const [saveloading,setSaveloading] = useState(false);
useEffect(()=>{
    if(formData){
        console.log("Form data:",formData);
        GenerateQuestinList();
    }
},[formData])

 const GenerateQuestinList=async()=>{
    setLoaing(true);
    try{
        const result = await axios.post('/api/ai-model',{
            ...formData
        })
        console.log("Api responce result:",result.data.content);
        const Content = result.data.content;
        const FINAL_CONTENT = Content.replace("```json", "")
                                    .replace("```", "")
                                    .replace(/\\n/g, '\n')
                                    .trim();
        setQuestionList(JSON.parse(FINAL_CONTENT)?.interviewQuestions);
        setLoaing(false);
    }catch(e){
        console.log("Error in api call",e);
        toast("Server Error ,Try again!");
        setLoaing(false);
    }    
 }

 const onFinish=async()=>{
    setSaveloading(true);
    const interview_id = uuidv4();
    const { data, error } = await supabase
    .from('Interviews')
    .insert([
    { ...formData,
        questionList:questionList,
        userEmail:user?.email,
        interview_id:interview_id
     },
    ])
    .select()
    setSaveloading(false);

    onCreateLink(interview_id);

    console.log("Data from supabase",data);
        
 }


  return (
    <div>
        {loading&&
        <div className='p-5 bg-blue-50 rounded-xl border-grey-100 flex gap-5 items-center border border-primary'>
            <Loader2Icon className='animate-spin'/>
            <div>
                <h2 className='font-medium '>Generating Interview Questions</h2>
                <p className='text-pretty'>Our Ai is Drafting Personalised uestions based on your job position</p>
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