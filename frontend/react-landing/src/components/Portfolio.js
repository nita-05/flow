import React, { useEffect, useState } from 'react';
import metricsService from '../services/metricsService';
import Counter from './Counter';

const Portfolio = ({ onGetStarted }) => {
  const [stats, setStats] = useState({ totalStories: 0, totalAnalyzedFiles: 0, totalViews: 0, userSatisfaction: 0 });

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

  return (
    <section id="portfolio" className="py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
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
                    <div className="text-center space-y-6 sm:space-y-8">
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
                      
                      {/* Demo Flow Section - Inside Demo Container */}
                      <div className="mt-6 sm:mt-8">
                        <div className="text-center mb-4 sm:mb-6">
                          <h5 className="text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4">Demo Flow:</h5>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                          {/* Upload Step */}
                          <div className="flex items-center">
                            <button 
                              onClick={() => {
                                alert("🔐 Please login first to upload your videos!");
                              }}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              Upload
                            </button>
                            <div className="hidden sm:block ml-3 sm:ml-4">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Search Step */}
                          <div className="flex items-center">
                            <button 
                              onClick={() => {
                                alert("🔐 Please login first to search your memories!");
                              }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              Search
                            </button>
                            <div className="hidden sm:block ml-3 sm:ml-4">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Generate Step */}
                          <div className="flex items-center">
                            <button 
                              onClick={() => {
                                alert("🔐 Please login first to generate stories!");
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              Generate
                            </button>
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


        {/* Enhanced Social Proof / Trust Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl px-8 py-16 max-w-7xl mx-auto shadow-2xl border border-purple-300/50">
            <div className="space-y-12">
              {/* Header with badge */}
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full px-6 py-3 text-white shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Fresh Innovation - Just Launched</span>
              </div>
                
                <h3 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  Be Among the First to Experience the Future
              </h3>
                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                  Join the early adopters who are discovering the power of AI-driven video organization and storytelling
              </p>
            </div>
              
              {/* Early adoption metrics grid */}
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
                  <div className="text-gray-700 font-semibold">Early Stories</div>
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
                  <div className="text-sm text-gray-500 mt-1">Early content success</div>
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
                  <div className="text-sm text-gray-500 mt-1">Early adopters love it</div>
                </div>
              </div>
              
              {/* Early adopter testimonial */}
              <div className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-300/50 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <blockquote className="text-xl text-gray-700 italic mb-4 font-light">
                    "I'm so excited to be an early user of Memorify! The AI search is mind-blowing - I can finally find any moment from my videos instantly. This is the future!"
                  </blockquote>
                  <div className="text-gray-600 font-semibold">— Early Adopter</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl px-8 py-12 shadow-lg">
            <h3 className="text-3xl font-bold mb-4 text-white">
              🚀 Your memories deserve better. Try Memorify today!
            </h3>
            <p className="text-xl mb-8 text-white/90 font-light">
              Join thousands of users who've transformed their video collections into organized, searchable memories.
            </p>
            <button 
              onClick={onGetStarted} 
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Free →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
