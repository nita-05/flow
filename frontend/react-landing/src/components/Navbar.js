import React, { useState, useEffect } from 'react';

const Navbar = ({ onGetStarted }) => {
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-[#E9F1FA] via-[#F3F9FE] to-white border-b border-[#DDEBFA] shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 bg-[#00ABE4] rounded-lg flex items-center justify-center ring-2 ring-white">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="4" y="6" width="10" height="9" rx="2" />
                <path d="M16 8l5 2.8L16 13.6V8z" />
                <path d="M6 18c3 0 4.5-1.5 6.5-1.5S16 18 19 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-black">Footage flow</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="uppercase tracking-wider text-sm font-semibold text-[#0D1B2A] hover:text-[#0A1624]">How It Works</a>
            <a href="#portfolio" className="uppercase tracking-wider text-sm font-semibold text-[#0D1B2A] hover:text-[#0A1624]">Features</a>
            <button onClick={onGetStarted} className="px-5 py-2 rounded-xl bg-white text-[#0D1B2A] border border-[#DDEBFA] shadow hover:bg-[#F2F8FE] transition-colors">
              LOGIN
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="flex flex-col space-y-1 p-2"
            >
              <span className={`w-6 h-0.5 bg-[#0D1B2A] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#0D1B2A] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-[#0D1B2A] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col space-y-2 pt-2">
              {/* How It Works */}
              <div>
                <button 
                  onClick={() => toggleDropdown('how-it-works')}
                  className="nav-link text-lg slide-up w-full text-left uppercase tracking-wider text-sm font-semibold" 
                  style={{animationDelay: '0.1s'}}
                >
                  How It Works
                </button>
                {activeDropdown === 'how-it-works' && (
                  <div className="ml-4 mt-2 space-y-2 slide-up" style={{animationDelay: '0.2s'}}>
                    <a href="#about" className="block text-gray-300 hover:text-white">Bulk Upload</a>
                    <a href="#about" className="block text-gray-300 hover:text-white">AI Processing</a>
                    <a href="#about" className="block text-gray-300 hover:text-white">Search Engine</a>
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <button 
                  onClick={() => toggleDropdown('features')}
                  className="nav-link text-lg slide-up w-full text-left uppercase tracking-wider text-sm font-semibold" 
                  style={{animationDelay: '0.2s'}}
                >
                  Features
                </button>
                {activeDropdown === 'features' && (
                  <div className="ml-4 mt-2 space-y-2 slide-up" style={{animationDelay: '0.3s'}}>
                    <a href="#portfolio" className="block text-gray-300 hover:text-white">AI Transcription</a>
                    <a href="#portfolio" className="block text-gray-300 hover:text-white">Vision Tagging</a>
                    <a href="#portfolio" className="block text-gray-300 hover:text-white">Story Generation</a>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button onClick={onGetStarted} className="w-full px-5 py-2 rounded-lg bg-white text-[#0D1B2A] border border-[#DDEBFA] shadow-sm hover:bg-[#F2F8FE] transition-colors">LOGIN</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
