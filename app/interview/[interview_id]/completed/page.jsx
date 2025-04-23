"use client"
import React from 'react';
import { Home, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const InterviewCompleted = () => {
  const router = useRouter();

  const handleReturnHome = () => {
    router.push('/');
  };

  const handleViewOpportunities = () => {
    router.push('/opportunities');
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white font-sans antialiased flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center space-y-8 py-16 px-4">
        {/* Success Icon */}
        <div className="rounded-full bg-green-500 p-4 shadow-lg">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-800 text-center">Interview Complete!</h1>

        {/* Subheading */}
        <p className="text-lg text-gray-600 text-center max-w-2xl">
          Thank you for participating in the AI-driven interview with Alcruiter. Your responses have been recorded successfully.
        </p>

        {/* Image */}
        <div className="rounded-xl overflow-hidden shadow-xl">
          <img
            src="/api/placeholder/800/400"
            alt="Interview Illustration"
            className="w-full h-auto object-cover max-w-4xl"
          />
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-xl space-y-6 border border-gray-100">
          <div className="flex items-center justify-center rounded-full bg-blue-100 w-16 h-16 mx-auto">
            <ArrowRight className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 text-center">What's Next?</h2>
          
          <p className="text-gray-600 text-center">
            The recruiter will review your interview responses and will contact you soon regarding the next steps in the hiring process.
          </p>
          
          <div className="flex items-center justify-center text-gray-500 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            <span>You can expect a response within 2-3 business days</span>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center w-full pt-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">1</div>
              <p className="text-xs mt-2 text-gray-600">Application</p>
            </div>
            <div className="h-1 flex-1 bg-green-500 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">2</div>
              <p className="text-xs mt-2 text-gray-600">AI Interview</p>
            </div>
            <div className="h-1 flex-1 bg-gray-300 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">3</div>
              <p className="text-xs mt-2 text-gray-600">Team Interview</p>
            </div>
            <div className="h-1 flex-1 bg-gray-300 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">4</div>
              <p className="text-xs mt-2 text-gray-600">Offer</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button 
            onClick={handleReturnHome}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-3 px-6 flex items-center justify-center space-x-2 transition duration-300 ease-in-out shadow-sm"
          >
            <Home className="h-5 w-5" />
            <span>Return to Homepage</span>
          </button>
          
          <button 
            onClick={handleViewOpportunities}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-6 flex items-center justify-center space-x-2 transition duration-300 ease-in-out shadow-sm"
          >
            <span>View Other Opportunities</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 text-gray-600 text-center py-6">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Alcruiter. All rights reserved.</p>
          <div className="flex justify-center mt-2 space-x-4">
            <a href="#" className="text-gray-500 hover:text-blue-600 transition">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InterviewCompleted;