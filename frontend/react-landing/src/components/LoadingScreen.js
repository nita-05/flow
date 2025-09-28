import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing AI...');

  const loadingSteps = [
    { text: 'Initializing AI...', duration: 1000 },
    { text: 'Loading Memories...', duration: 1500 },
    { text: 'Processing Stories...', duration: 1200 },
    { text: 'Ready to Transform!', duration: 800 }
  ];

  useEffect(() => {
    let currentStep = 0;
    let totalDuration = 0;

    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingText(loadingSteps[currentStep].text);
        totalDuration += loadingSteps[currentStep].duration;
        
        // Animate progress
        const targetProgress = ((currentStep + 1) / loadingSteps.length) * 100;
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= targetProgress) {
              clearInterval(progressInterval);
              return targetProgress;
            }
            return prev + 2;
          });
        }, 50);

        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo Animation */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-900 rounded-2xl flex items-center justify-center mx-auto pulse-glow">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mt-4 text-shimmer">Footage Flow</h1>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-primary-900 to-secondary-900 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-300 text-lg loading-dots">{loadingText}</p>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-900 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

