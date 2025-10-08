import React from 'react';

const Hero = ({ onGetStarted }) => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      </div>
      
      
      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <div className="space-y-12">
          {/* Hero Text */}
          <div className="space-y-8">
            <h1 className="text-6xl md:text-8xl font-black leading-tight">
              <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                Memorify
              </span>
              <span className="block text-4xl md:text-6xl text-gray-800 mt-4">
                AI-Powered Memory Stories
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto font-light">
              Transform your photos, videos, and audio into magical stories with the power of AI. 
              Upload, organize, and create beautiful narratives from your memories.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={onGetStarted}
              className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
            
            <button className="px-12 py-6 bg-white/80 backdrop-blur-lg text-gray-800 font-semibold text-xl rounded-2xl border border-purple-300 hover:bg-white transition-all duration-300 shadow-lg">
              Watch Demo
            </button>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {['✨ AI-Powered', '📸 Smart Organization', '🎬 Video Stories', '🔍 Semantic Search'].map((feature, index) => (
              <div key={index} className="px-6 py-3 bg-white/80 backdrop-blur-lg rounded-full border border-purple-300 text-gray-800 font-medium hover:bg-white transition-all duration-300 shadow-lg">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-600 animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
