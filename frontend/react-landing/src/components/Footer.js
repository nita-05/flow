import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 py-16 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="6" width="10" height="9" rx="2" />
                  <path d="M16 8l5 2.8L16 13.6V8z" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white">Memorify</span>
            </div>
            <p className="text-white/80 mb-6 max-w-md text-lg leading-relaxed">
              Transform your scattered memories into organized, searchable stories with AI-powered video search and story generation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Product</h3>
            <ul className="space-y-3">
              <li><a href="#about" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</a></li>
              <li><a href="#portfolio" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">How It Works</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Demo</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Help Center</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact Us</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Privacy Policy</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/80 text-lg">
            © 2025 Memorify. All rights reserved. Made with ❤️ for your memories.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
