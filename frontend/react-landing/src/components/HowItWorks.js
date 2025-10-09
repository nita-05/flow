import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const HowItWorks = ({ onGetStarted }) => {
  const [, setHoveredCard] = useState(null);
  
  // Activate scroll-reveal animations
  useScrollAnimation();

  const benefits = [
    {
      icon: "🔎",
      title: "Search Anything",
      description: "Instantly find moments with AI tagging & transcripts."
    },
    {
      icon: "🎬",
      title: "Story Builder", 
      description: "Turn raw footage into short AI-generated stories."
    },
    {
      icon: "☁",
      title: "Secure Cloud Storage",
      description: "Your memories, safe and searchable."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Upload & Process",
      description: "Simply upload your videos and watch as our AI instantly analyzes, transcribes, and tags every moment with intelligent metadata.",
      gradient: "from-purple-500 to-blue-600"
    },
    {
      number: "2", 
      title: "Search Anything",
      description: "Use natural language to find any moment: 'show me happy times' or 'find beach memories' - our AI understands context and meaning.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      number: "3",
      title: "Generate Stories", 
      description: "Let AI create beautiful, shareable stories from your memories. Perfect for social media, family albums, or personal keepsakes.",
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  useEffect(() => {}, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onGetStarted={onGetStarted} />
      
      {/* Step-by-Step Process */}
      <section className="pt-24 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              How It Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple 3-step process to transform your memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="group">
                <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 border border-purple-300/50">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${step.gradient.replace('from-', 'from-').replace(' to-', ' to-')} bg-clip-text text-transparent mb-4`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
