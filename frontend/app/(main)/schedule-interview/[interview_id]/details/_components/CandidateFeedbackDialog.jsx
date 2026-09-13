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
    const rating = {
        technicalSkills: feedback?.rating?.technicalSkills ?? feedback?.rating?.techicalSkills ?? 0,
        communication: feedback?.rating?.communication ?? 0,
        problemSolving: feedback?.rating?.problemSolving ?? 0,
        experience: feedback?.rating?.experience ?? feedback?.rating?.experince ?? 0,
        overallScore: feedback?.rating?.overallScore,
    };
  return (
   
        <Dialog>
        <DialogTrigger asChild><Button variant="outline" className="text-primary">View Report</Button></DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className='flex justify-between items-center'>
                    <div className='mt-3 flex item-center gap-5'>
                        <h2 className='rounded-full bg-blue-700 flex justify-center items-center p-5 w-5 h-5 text-white font-bold '>{candidate.userName[0]}</h2>
                        <div>
                        <h2 className='font-bold'>{candidate?.userName}</h2>
                        <h2 className=''>{candidate?.userEmail}</h2>
                        </div>
                    </div>

                    <div className='flex gap-3 items-center'>
                        <h2 className='text-primary text-2xl font-bold'>{rating.overallScore ?? '-'}/100</h2>
                    </div>
                </div>    
                        
                        <div className='mt-5'>
                            <h2 className='font-bold'>Skill Assesment</h2>
                            <div className=' grid grid-cols-2 gap-3 mt-3'>
                                <div>
                                    <h2 className='flex justify-between'>Technical Skills <span>{rating.technicalSkills}/10</span></h2>
                                    <Progress value={rating.technicalSkills*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>communication<span>{rating.communication}/10</span></h2>
                                    <Progress value={rating.communication*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>Problem solving <span>{rating.problemSolving}/10</span></h2>
                                    <Progress value={rating.problemSolving*10}></Progress>
                                </div>
                                <div>
                                    <h2 className='flex justify-between'>Experience <span>{rating.experience}/10</span></h2>
                                    <Progress value={rating.experience*10}></Progress>
                                </div>
                            </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="mt-8">
                                <h2 className="font-bold mb-2">Performance Summary</h2>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feedback?.summary || "No summary available."}
                                </p>
                            </div>

                            {/* Recommendation Card */}
                            {(feedback?.recommendation || feedback?.Recommendation) && (
                                <div className='mt-8 p-5 rounded-lg bg-blue-50'>
                                    <h2 className='font-bold text-blue-800'>
                                        Recommendation: {feedback.recommendation || feedback.Recommendation}
                                    </h2>
                                    <p className='text-blue-700 text-sm'>
                                        {feedback.recommendationMsg || feedback.RecommendationMsg}
                                    </p>
                                </div>
                            )}
              </div>
            </DialogDescription>
            </DialogHeader>
        </DialogContent>
        </Dialog>

    
  )
}

export default CandidateFeedbackDialog