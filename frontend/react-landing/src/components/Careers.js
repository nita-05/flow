import React from 'react';

const Careers = ({ onGetStarted }) => {
  return (
    <section id="careers" className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content removed */}
          <div></div>

          {/* Right Content simplified */}
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              {/* Content intentionally minimal per request */}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Careers;
