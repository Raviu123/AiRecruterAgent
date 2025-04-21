import React from 'react'

const QuestionListCOntainer = ({questionList}) => {
  return (
    <div>
        <h2 className='font-bold text-lg mb-3'>Generated INterview Questions</h2>
                <div className='p-5 border border-grey-200 rounded-xl bg-white'>
                {questionList.map((item,index)=>(
                    <div key={index} className='p-5 bg-blue-50 rounded-xl border-grey-200 flex justify-between items-center border-2 border-blue-300 my-5'>
                        <h2 className='font-medium '>{index+1}. {item.question}</h2>
                        <h2 className='text-sm border border-blue-300 bg-blue-50 rounded-xl p-2'>{item.type}</h2>
                    </div>
                ))}
            </div>
    </div>
  )
}

export default QuestionListCOntainer