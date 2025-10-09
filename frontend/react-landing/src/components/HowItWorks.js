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
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              How It Works
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
              Transform your memories into searchable, shareable stories with the power of AI. 
              Here's how Memorify makes your digital life more organized and meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Simple 3-Step Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From upload to story creation, Memorify handles everything automatically
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

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Why Choose Memorify?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AI technology meets intuitive design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 border border-purple-200/50">
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Memories?
            </h2>
            <p className="text-xl text-white/90 mb-8 font-light">
              Join thousands of users who've discovered the power of AI-driven memory organization.
            </p>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
