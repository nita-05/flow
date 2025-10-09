import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import metricsService from '../services/metricsService';
import Counter from './Counter';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const Features = ({ onGetStarted }) => {
  const [stats, setStats] = useState({ totalStories: 0, totalAnalyzedFiles: 0, totalViews: 0, userSatisfaction: 0 });
  
  // Activate scroll-reveal animations
  useScrollAnimation();

  // Fetch live metrics once mounted
  useEffect(() => {
    let isMounted = true;
    metricsService.fetchSummary()
      .then((data) => {
        if (!isMounted) return;
        // Defensive defaults
        setStats({
          totalStories: data.totalStories || 0,
          totalAnalyzedFiles: data.totalAnalyzedFiles || 0,
          totalViews: data.totalViews || 0,
          userSatisfaction: data.userSatisfaction || 0
        });
      })
      .catch(() => {
        // Keep zeros on error
      });
    return () => { isMounted = false; };
  }, []);

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
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Features
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
              Discover the powerful features that make Memorify the ultimate AI-powered memory management platform.
              Transform how you organize, search, and share your digital memories.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Powerful Features
            </h2>
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

      {/* Demo Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              See Memorify in Action
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-light">
              Watch how our AI transforms your raw footage into organized, searchable memories and beautiful stories
            </p>
          </div>

          {/* Enhanced Demo Section */}
          <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl p-4 sm:p-8 lg:p-12 mb-16 max-w-7xl mx-auto shadow-2xl border border-purple-300/50">
            <div className="space-y-8 sm:space-y-12">
              {/* Demo Video Section */}
              <div className="text-center">
                <div className="inline-block w-full max-w-2xl">
                  <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 rounded-3xl shadow-2xl overflow-hidden border border-purple-300/50">
                    {/* Browser Header */}
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="ml-4 text-sm font-medium text-gray-700">Memorify Demo</div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Demo Content */}
                    <div className="p-4 sm:p-8 bg-gradient-to-br from-purple-50 to-blue-50">
                      <div className="text-center space-y-4 sm:space-y-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <rect x="4" y="6" width="10" height="9" rx="2" />
                            <path d="M16 8l5 2.8L16 13.6V8z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 text-center">Watch Memorify in Action</h4>
                          <p className="text-sm sm:text-base text-gray-600 text-center px-2">Experience the power of AI-driven video search and story generation</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 rounded-xl p-3 sm:p-4 shadow-sm border border-purple-300/50 text-center">
                          <div className="text-xs sm:text-sm text-gray-500 mb-2 text-center">Demo Flow:</div>
                          <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-medium text-gray-700 flex-wrap">
                            <span className="bg-purple-100 px-2 sm:px-3 py-1 rounded-full">Upload</span>
                            <span className="text-gray-400">→</span>
                            <span className="bg-blue-100 px-2 sm:px-3 py-1 rounded-full">Search</span>
                            <span className="text-gray-400">→</span>
                            <span className="bg-green-100 px-2 sm:px-3 py-1 rounded-full">Generate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Trusted by Users Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of users who've transformed their digital memories
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl px-8 py-16 max-w-7xl mx-auto shadow-2xl border border-purple-300/50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                  <Counter value={stats.totalStories} />
                </div>
                <div className="text-gray-700 font-semibold">Stories Created</div>
                <div className="text-sm text-gray-500 mt-1">AI-generated narratives</div>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="4" y="6" width="10" height="9" rx="2" />
                    <path d="M16 8l5 2.8L16 13.6V8z" />
                  </svg>
                </div>
                <div className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                  <Counter value={stats.totalAnalyzedFiles} />
                </div>
                <div className="text-gray-700 font-semibold">Videos Analyzed</div>
                <div className="text-sm text-gray-500 mt-1">Smart AI processing</div>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                  <Counter value={stats.totalViews} />
                </div>
                <div className="text-gray-700 font-semibold">Views Generated</div>
                <div className="text-sm text-gray-500 mt-1">Content engagement</div>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                  <Counter value={stats.userSatisfaction} suffix="%" />
                </div>
                <div className="text-gray-700 font-semibold">User Satisfaction</div>
                <div className="text-sm text-gray-500 mt-1">Happy customers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Experience These Features?
            </h2>
            <p className="text-xl text-white/90 mb-8 font-light">
              Start your free trial today and discover how AI can transform your digital memories.
            </p>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
