import React, { useState, useEffect } from 'react';

const About = () => {
  const [, setHoveredCard] = useState(null);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
      title: "Bulk Upload System",
      description: "Upload your entire phone gallery at once. Our AI processes everything automatically, analyzing content and generating intelligent tags for seamless organization.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
      title: "AI Transcription & Vision",
      description: "Advanced AI transcribes all speech in videos and uses GPT Vision to analyze and tag visual content, making every memory searchable by meaning.",
      color: "from-green-500 to-blue-600"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      title: "Semantic Search Engine",
      description: "Search by meaning: 'show me all the times I was happy' or 'find my beach memories'. Our AI understands context, emotions, and concepts beyond keywords.",
      color: "from-purple-500 to-pink-600"
    }
  ];

  useEffect(() => {}, []);

  return (
    <section id="about" className="py-20 bg-secondary-100 relative overflow-hidden">
      {/* Decorative background removed */}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-section font-extrabold text-black mb-4">
            How Footage Flow Works
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Our AI-powered platform transforms your scattered memories into cohesive, uplifting narratives that celebrate the best moments of your life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center group"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative mb-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto text-white`}>
                  {feature.icon}
                </div>
                {/* Animated Ring removed */}
              </div>
              
              <h3 className="text-xl font-semibold text-black mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {feature.description}
              </p>
              {/* Hover overlay removed */}
            </div>
          ))}
        </div>

        {/* Progress bar removed */}

        <div className="text-center max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed">
            Our mission is to transform scattered memories into cohesive, uplifting narratives that celebrate the best moments of your life. We believe in the power of positive storytelling to inspire and connect humanity.
          </p>
          
          {/* CTA removed */}
        </div>
      </div>
    </section>
  );
};

export default About;
