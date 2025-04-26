import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { Button } from '@/components/ui/button';
  import { Progress } from '@/components/ui/progress';



const CandidateFeedbackDialog = ({candidate}) => {

    const  feedback = candidate?.feedback?.feedback;
  return (
   
        <Dialog>
        <DialogTrigger aschild><Button variant="outline" className="text-primary">View Report</Button></DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription aschild>
                <div className='flex justify-between items-center'>
                    <div className='mt-3 flex item-center gap-5'>
                        <h2 className='rounded-full bg-blue-700 flex justify-center items-center p-5 w-5 h-5 text-white font-bold '>{candidate.userName[0]}</h2>
                        <div>
                        <h2 className='font-bold'>{candidate?.userName}</h2>
                        <h2 className=''>{candidate?.userEmail}</h2>
                        </div>
                    </div>

                    <div className='flex gap-3 items-center'>
                        <h2 className='text-primary text-2xl font-bold'>6/10</h2>
                    </div>
                </div>    
                        
                        <div className='mt-5'>
                            <h2 className='font-bold'>Skill Assesment</h2>
                            <div className=' grid grid-cols-2 gap-3 mt-3'>
                                <div>
                                    <h2 className='flex justify-between'>Technical Skills <span>{feedback?.rating.techicalSkills}/10</span></h2>
                                    <Progress value={feedback?.rating.techicalSkills*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>communication<span>{feedback?.rating.communication}/10</span></h2>
                                    <Progress value={feedback?.rating.communication*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>Problem solving <span>{feedback?.rating.problemSolving}/10</span></h2>
                                    <Progress value={feedback?.rating.problemSolving*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>Experience <span>{feedback?.rating.experince}/10</span></h2>
                                    <Progress value={feedback?.rating.experince*10}></Progress>
                                </div>
                            </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="mt-8">
                                <h2 className="font-bold mb-2">Performance Summary</h2>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feedback?.summary || 
                                    "Michael demonstrated exceptional technical proficiency and problem-solving abilities. His communication was clear and professional throughout the interview. He showed strong understanding of full-stack development concepts and provided excellent examples from his past experience."}
                                </p>
                            </div>

                            {/* Recommendation Card */}
                            {feedback?.Recommendation && (
                                <div
                                    className={`mt-8 p-5 rounded-lg flex justify-between items-center
                                        ${feedback.Recommendation === "YES" ? "bg-green-100" : "bg-red-100"}`}
                                >
                                    <div>
                                        <h2 className={`font-bold 
                                            ${feedback.Recommendation === "YES" ? "text-green-700" : "text-red-700"}`}>
                                            Recommendation: {feedback?.Recommendation}
                                        </h2>
                                        <p className={`${feedback.Recommendation === "YES" ? "text-green-700" : "text-red-700"} text-sm`}>
                                            {feedback?.RecommendationMsg}
                                        </p>
                                    </div>
                                    <Button
                                        className={`text-white 
                                            ${feedback.Recommendation === "YES" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                                    >
                                        {feedback.Recommendation === "YES" ? "Proceed to Offer" : "Reject Candidate"}
                                    </Button>
                                </div>
                            )}
                
            </DialogDescription>
            </DialogHeader>
        </DialogContent>
        </Dialog>

    
  )
}

export default CandidateFeedbackDialog