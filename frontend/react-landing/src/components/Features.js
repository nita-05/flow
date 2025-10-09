import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const Features = ({ onGetStarted }) => {
  // Activate scroll-reveal animations
  useScrollAnimation();

  const features = [
    {
      icon: "🎬",
      title: "AI-Powered Video Analysis",
      description: "Advanced AI automatically transcribes, tags, and analyzes every moment in your videos with intelligent metadata.",
      gradient: "from-purple-500 to-blue-600"
    },
    {
      icon: "🔍",
      title: "Semantic Search",
      description: "Search by meaning, emotions, or concepts - not just keywords. Find 'happy moments' or 'beach memories' instantly.",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: "✨",
      title: "Story Generation",
      description: "Transform raw footage into beautiful, shareable stories perfect for social media, family albums, or personal keepsakes.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: "☁️",
      title: "Secure Cloud Storage",
      description: "Your memories are safely stored in the cloud with enterprise-grade security and automatic backups.",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: "📱",
      title: "Cross-Platform Access",
      description: "Access your memories from any device - desktop, mobile, or tablet. Your stories follow you everywhere.",
      gradient: "from-pink-500 to-red-600"
    },
    {
      icon: "🚀",
      title: "Lightning Fast",
      description: "Process thousands of videos in minutes, not hours. Our optimized AI pipeline delivers results at unprecedented speed.",
      gradient: "from-red-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar onGetStarted={onGetStarted} />
      
      {/* Features Section */}
      <section className="pt-24 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Powerful Features
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to transform your digital memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 border border-purple-300/50 h-full">
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className={`text-xl font-bold bg-gradient-to-r ${feature.gradient.replace('from-', 'from-').replace(' to-', ' to-')} bg-clip-text text-transparent mb-4`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
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

export default Features;
