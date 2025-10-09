import React, { useState, useEffect } from 'react';

const Navbar = ({ onGetStarted, onNavigateToHowItWorks, onNavigateToFeatures }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null); // Close any open dropdown when toggling menu
  };

  const toggleDropdown = (item) => {
    setActiveDropdown(activeDropdown === item ? null : item);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/80 backdrop-blur-lg border-b border-purple-200/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Memorify</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <button onClick={onNavigateToHowItWorks} className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105 text-sm lg:text-base">How It Works</button>
            <button onClick={onNavigateToFeatures} className="text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 hover:scale-105 text-sm lg:text-base">Features</button>
            <button onClick={onGetStarted} className="px-6 lg:px-8 py-2 lg:py-3 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-sm lg:text-base">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="flex flex-col space-y-1 p-2"
              aria-label="Toggle mobile menu"
            >
              <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg rounded-2xl mt-2 p-4 sm:p-6 border border-purple-200/30 shadow-lg">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              {/* How It Works */}
              <button 
                onClick={() => {
                  onNavigateToHowItWorks();
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-purple-600 font-semibold w-full text-left transition-colors duration-300 text-base sm:text-lg py-2" 
              >
                How It Works
              </button>

              {/* Features */}
              <button 
                onClick={() => {
                  onNavigateToFeatures();
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-purple-600 font-semibold w-full text-left transition-colors duration-300 text-base sm:text-lg py-2" 
              >
                Features
              </button>

              {/* Primary CTA */}
              <button 
                onClick={() => {
                  onGetStarted();
                  setIsMobileMenuOpen(false);
                }} 
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
