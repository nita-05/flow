import React, { useState, useEffect } from 'react';

const Description = () => {
  const [, setCurrentWord] = useState(0);

  // const words = ["Memories", "Stories", "Moments", "Experiences", "Journeys"];
  const fullText = "At Footage Flow, we're building Humanity's Video Search Engine. Our AI-powered platform processes your entire phone gallery, transcribes speech, analyzes visual content, and creates beautiful stories that celebrate your life's best moments. Transform scattered memories into cohesive narratives that inspire and connect.";

  useEffect(() => {}, []);

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      {/* Decorative elements removed */}

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-4">
            Building Humanity's Video Search Engine
          </h2>
          <div className="text-2xl font-semibold text-primary-900">
            Transforming <span className="inline-block">Journeys</span>
          </div>
        </div>

        {/* Main Description */}
        <p className="text-lg text-gray-700 leading-relaxed">
          {fullText}
        </p>

        {/* Stats and CTA removed */}
      </div>
    </section>
  );
};

export default Description;
