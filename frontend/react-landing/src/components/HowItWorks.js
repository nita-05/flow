import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const HowItWorks = ({ onGetStarted }) => {
  const [hoveredStep, setHoveredStep] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Activate scroll-reveal animations
  useScrollAnimation();

  const steps = [
    {
      number: "1",
      title: "Upload & Process",
      description: "Simply upload your videos and watch as our AI instantly analyzes, transcribes, and tags every moment with intelligent metadata.",
      gradient: "from-purple-500 via-blue-500 to-indigo-600",
      icon: "📤",
      features: ["Smart Video Analysis", "AI Transcription", "Intelligent Tagging", "Metadata Extraction"],
      color: "purple"
    },
    {
      number: "2", 
      title: "Search Anything",
      description: "Use natural language to find any moment: 'show me happy times' or 'find beach memories' - our AI understands context and meaning.",
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      icon: "🔍",
      features: ["Natural Language Search", "Context Understanding", "Semantic Matching", "Instant Results"],
      color: "blue"
    },
    {
      number: "3",
      title: "Generate Stories", 
      description: "Let AI create beautiful, shareable stories from your memories. Perfect for social media, family albums, or personal keepsakes.",
      gradient: "from-indigo-500 via-purple-500 to-pink-600",
      icon: "✨",
      features: ["AI Story Creation", "Multiple Formats", "Social Sharing", "Custom Templates"],
      color: "indigo"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar onGetStarted={onGetStarted} />
      
      {/* Hero Section with Animated Background */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-purple-700 font-semibold mb-8 shadow-lg">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></span>
            AI-Powered Memory Transformation
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight">
            How It Works
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Transform your video memories into searchable, shareable stories with our 
            <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> AI-powered platform</span>
          </p>

          {/* Interactive Demo Button */}
          <button 
            onClick={() => setActiveStep(0)}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            <span className="mr-3">🚀</span>
            See How It Works
            <span className="ml-3">→</span>
          </button>
        </div>
      </section>

      {/* Enhanced Step-by-Step Process */}
      <section className="relative pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-16">
            <div className="flex items-center space-x-4">
              {steps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className={`w-4 h-4 rounded-full transition-all duration-500 ${
                      activeStep >= index 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg' 
                        : 'bg-gray-300'
                    }`}
                  ></div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                      activeStep > index 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                        : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`group relative transition-all duration-700 ${
                  activeStep === index ? 'scale-105 z-10' : 'scale-100'
                }`}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setActiveStep(index)}
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 transform -translate-x-6 z-0"></div>
                )}
                
                {/* Step Card */}
                <div className={`
                  relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl 
                  border border-white/50 transition-all duration-500 cursor-pointer
                  hover:shadow-3xl hover:-translate-y-4 hover:scale-105
                  ${activeStep === index ? 'ring-4 ring-purple-500/30 shadow-purple-500/20' : ''}
                  ${hoveredStep === index ? 'bg-white/90' : ''}
                `}>
                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400/50 rounded-full animate-ping"></div>
                    <div className="absolute bottom-6 left-6 w-1 h-1 bg-blue-400/50 rounded-full animate-ping delay-300"></div>
                    <div className="absolute top-1/2 left-4 w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-ping delay-700"></div>
                  </div>

                  {/* Step Number Badge */}
                  <div className={`
                    absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br ${step.gradient} 
                    rounded-2xl flex items-center justify-center shadow-xl
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>

                  {/* Step Icon */}
                  <div className="text-6xl mb-6 text-center">
                    <span className="inline-block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                      {step.icon}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 className={`
                    text-2xl font-black mb-4 text-center
                    bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent
                  `}>
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-gray-700 leading-relaxed mb-6 text-center">
                    {step.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300"
                      >
                        <div className={`w-2 h-2 bg-gradient-to-r ${step.gradient} rounded-full mr-3 flex-shrink-0`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`
                    absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} 
                    opacity-0 group-hover:opacity-5 transition-opacity duration-300
                  `}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <button 
              onClick={onGetStarted}
              className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <span className="mr-3">🎯</span>
              Start Your AI Journey
              <span className="ml-3">✨</span>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
