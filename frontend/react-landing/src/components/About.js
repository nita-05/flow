import React, { useState, useEffect } from 'react';

const About = () => {
  const [, setHoveredCard] = useState(null);

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

  useEffect(() => {}, []);

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Key Benefits
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-light">
            Experience the power of AI-driven video organization and storytelling
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="text-center group bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 hover:scale-105 border border-purple-300/50"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">{benefit.icon}</span>
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg font-medium">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
