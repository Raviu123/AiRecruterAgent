import React from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { Clock ,List,Calendar ,Mail,ArrowLeft,Plus} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner';

const InterviewLink = ({interview_id, formData}) => {

    const url = process.env.NEXT_PUBLIC_HOST_URL + '/' + interview_id;

    const GetInterviewUrl = () => {
        return url;
    }

    const OncopyLink=async ()=>{
        await navigator.clipboard.writeText(url)
        toast('Link Copied')
    }

  return (
    <div className='flex flex-col items-center justify-center mt-10'>
        <Image src={'/check.png'} alt="check" width={200} height={200}
        className='w-[50px] h-[50px]'/>
        <h2 className='font-bold text-lg mt-4'>Your AI interview is Ready!</h2>
        <p className='mt-3'>Share thsi Link with your candidates to start interview process</p>
        
        <div className='w-full p-7 mt-6 rounded-xl bg-white '>
            <div className='flex justify-between items-center'>
                <h2 className='font-bold'>Interview Link</h2>
                <h2 className='p-1 px-2 text-primary bg-blue-50 rounded-xl'>Valid for 30 days</h2>

                
            </div>
            <div className='mt-3 flex gap-2'>
                <Input defaultValue={GetInterviewUrl()} disabled={true} />
                <Button className="cursor-pointer" onClick={()=>OncopyLink()}><Copy/>Copy Link</Button>
            </div>
            <hr className='my-5'/>
            <div className='flex gap-5 items-center'>
                <h2 className='text-sm text-grey-500'><Clock className='h-4 w-4'/> {formData?.interviewduration}</h2>
                <h2 className='text-sm text-grey-500'><List className='h-4 w-4'/> {formData?.interviewduration}</h2>
                <h2 className='text-sm text-grey-500'><Calendar className='h-4 w-4'/> {formData?.interviewduration}</h2>
            </div>
        </div>

        <div className='mt-7 bg-white p-5 rounded-lg w-full'>
            <h2 className='font-bold'>Share Via</h2>
            <div className='flex gap-7 mt-2'>
                <Button variant={'outline'} className=""> <Mail></Mail> Email</Button>
                <Button variant={'outline'} className=""> <Mail></Mail> Slack </Button>
                <Button variant={'outline'} className=""> <Mail></Mail> Whatsapp</Button>
            </div>
            
        </div>
        <div className='mt-7 w-full flex justify-between items-center'>
            <Link href={'/dashboard'} >
            <Button variant={'outline'}><ArrowLeft></ArrowLeft> Back to Dashboard</Button>
            </Link>
            
            <Link href={'/create-interview'}>
            <Button><Plus/> Create New Interview</Button>
            </Link>
          
        </div>
    </div>
  )
}

export default InterviewLink