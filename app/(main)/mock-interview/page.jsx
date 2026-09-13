"use client"
import React, { useState } from 'react'
import FormContainer from '../dashboard/create-interview/_component/FormContainer'

export default function MockInterviewPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Self-Service JD Mock Interview</h1>
        <p className="text-gray-500 mt-1">
          Upload or paste your target Job Description to generate a tailored voice mock interview powered by AI.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <FormContainer />
      </div>
    </div>
  )
}
