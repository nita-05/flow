import React from 'react';

const Hero = ({ onGetStarted }) => {
  const fullText = "Transform Your Memories Into Meaningful Stories";

  return (
    <section className="pt-24 pb-16 bg-secondary-100 overflow-hidden relative">

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-hero font-black text-[#0D1B2A] leading-tight">
                <span className="block">{fullText}</span>
                <span className="block">With AI-Powered Intelligence</span>
              </h1>
            </div>
            
            <p className="text-xl text-gray-700 leading-relaxed max-w-2xl">
              Upload your entire phone gallery, search by meaning, and let AI create beautiful "Footage Flow" stories that celebrate your life's best moments.
            </p>

            {/* CTA buttons removed as requested */}
            {/* Stats section removed as requested */}
          </div>

          {/* Hero Visual - Replace with project-themed logo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-[28rem] h-[22rem] rounded-[2rem] bg-gradient-to-b from-[#F7FBFF] to-[#EAF3FB] ring-1 ring-[#DDEBFA] shadow-[0_30px_60px_rgba(13,27,42,0.08)] flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-[#00ABE4] flex items-center justify-center shadow-md ring-4 ring-white">
                  <svg className="w-11 h-11 text-white" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
                    <rect x="14" y="18" width="28" height="22" rx="4" />
                    <path d="M46 24l10 6-10 6V24z" />
                    <path d="M18 44c6 0 9-3 13-3s7 3 13 3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M18 49c6 0 9-3 13-3s7 3 13 3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-4 text-[#0D1B2A] font-semibold text-lg">Footage Flow</div>
                <div className="text-sm text-[#0D1B2A]/70">Video Search & Story Creation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
