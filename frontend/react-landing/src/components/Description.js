import React, { useState, useEffect } from 'react';

const Description = () => {
  const [, setCurrentWord] = useState(0);

  const steps = [
    {
      number: "1️⃣",
      title: "Upload your footage",
      description: "Simply upload your videos from your phone, computer, or cloud storage. Our system accepts all major video formats."
    },
    {
      number: "2️⃣", 
      title: "AI transcribes & tags every video",
      description: "Our advanced AI analyzes speech, visual content, and context to create intelligent tags and transcripts for every moment."
    },
    {
      number: "3️⃣",
      title: "Search or generate a story instantly",
      description: "Find any moment instantly with natural language search, or let AI create beautiful stories from your memories."
    }
  ];

  useEffect(() => {}, []);

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            How It Works?
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-light">
            Get started in minutes with our simple 3-step process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center group bg-gradient-to-br from-blue-100/90 via-indigo-100/80 to-purple-100/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 border border-blue-300/50 relative">
              {/* Step Number Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg font-medium">
                  {step.description}
                </p>
              </div>
              
              {/* Connecting Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Description;
