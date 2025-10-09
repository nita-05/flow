import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Description from './components/Description';
import Portfolio from './components/Portfolio';
import Careers from './components/Careers';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import authService from './services/authService';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isNavigating, setIsNavigating] = useState(false);
  // Activate scroll-reveal animations globally
  useScrollAnimation();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Function to navigate to dashboard
  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/dashboard');
  };

  // Test function to simulate JWT handling
  const testJWT = () => {
    console.log('🧪 Testing JWT handling...');
    const testToken = 'test-jwt-token-12345';
    authService.setToken(testToken);
    console.log('🧪 Test token set:', authService.getToken());
    console.log('🧪 Navigating to dashboard...');
    setIsNavigating(true);
    // First change the URL, then set the page state
    window.history.pushState({}, '', '/dashboard');
    setCurrentPage('dashboard');
    console.log('🧪 Page state set to dashboard');
  };

  useEffect(() => {
    // Check if we're already on dashboard route
    if (window.location.pathname === '/dashboard') {
      console.log('🔍 Already on dashboard route, checking for token...');
      const token = authService.getToken();
      if (token) {
        console.log('✅ Token found, going to dashboard');
        setCurrentPage('dashboard');
        return;
      }
    }
    
    // Capture JWT from OAuth redirect and store
    try {
      console.log('🔍 Full URL:', window.location.href);
      console.log('🔍 Pathname:', window.location.pathname);
      console.log('🔍 Search:', window.location.search);
      console.log('🔍 Hash:', window.location.hash);
      
      // Try multiple ways to get JWT
      const params = new URLSearchParams(window.location.search);
      const jwt = params.get('jwt');
      
      // Also check hash for JWT (in case it's there)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const jwtFromHash = hashParams.get('jwt');
      
      const finalJwt = jwt || jwtFromHash;
      
      console.log('🔍 JWT from search params:', jwt ? 'Yes' : 'No');
      console.log('🔍 JWT from hash:', jwtFromHash ? 'Yes' : 'No');
      console.log('🔍 Final JWT found:', finalJwt ? 'Yes' : 'No');
      
      if (finalJwt) {
        console.log('✅ JWT token received from OAuth:', finalJwt.substring(0, 20) + '...');
        console.log('✅ Full JWT token:', finalJwt);
        // Set token in authService singleton
        authService.setToken(finalJwt);
        console.log('✅ Token set in authService singleton');
        console.log('✅ Current token in authService:', authService.getToken() ? 'Present' : 'Missing');
        // Clear the URL parameters and navigate to dashboard
        window.history.replaceState({}, '', '/dashboard');
        console.log('✅ Navigating to dashboard');
        setCurrentPage('dashboard');
      } else {
        console.log('ℹ️ No JWT found in URL');
        // Check if we have a valid token in localStorage from previous session
        const existingToken = authService.getToken();
        if (existingToken) {
          console.log('ℹ️ Found existing token in localStorage, checking validity...');
          console.log('ℹ️ Existing token:', existingToken.substring(0, 20) + '...');
          // If we're on dashboard route and have a token, go to dashboard
          if (window.location.pathname === '/dashboard') {
            console.log('✅ On dashboard route with existing token, going to dashboard');
            setCurrentPage('dashboard');
          } else {
            console.log('ℹ️ Not on dashboard route, staying on home');
          }
        } else {
          console.log('ℹ️ No existing token found');
        }
      }
    } catch (error) {
      console.error('❌ Error handling JWT:', error);
    }

    // Check current route and update state
    const checkRoute = () => {
      const path = window.location.pathname.replace(/\/$/, '');
      console.log('🔍 Checking route:', path);
      console.log('🔍 Current page state:', currentPage);
      
      if (path === '/dashboard') {
        console.log('🔍 Dashboard route detected');
        // Check if we have a token before going to dashboard
        const token = authService.getToken();
        console.log('🔍 Token check:', token ? 'Present' : 'Missing');
        if (token) {
          console.log('✅ Token found, going to dashboard');
          setCurrentPage('dashboard');
        } else {
          console.log('❌ No token found, redirecting to home');
          setCurrentPage('home');
          window.history.pushState({}, '', '/');
        }
      } else {
        console.log('🔍 Non-dashboard route, setting to home');
        setCurrentPage('home');
      }
    };

    // Check route on mount (but only if no JWT processing happened and not navigating)
    if (!window.location.search.includes('jwt=') && !isNavigating) {
      // Small delay to ensure state is properly set
      setTimeout(() => {
        checkRoute();
      }, 100);
    }

    // Listen for URL changes (for browser back/forward)
    const handlePopState = () => {
      console.log('Popstate event detected');
      checkRoute();
    };

    // Also check route periodically in case of direct navigation
    const interval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard' && currentPage !== 'dashboard') {
        console.log('Route change detected via interval, switching to dashboard');
        setCurrentPage('dashboard');
      } else if (currentPath !== '/dashboard' && currentPage !== 'home') {
        console.log('Route change detected via interval, switching to home');
        setCurrentPage('home');
      }
    }, 1000);

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [currentPage, isNavigating]);

  if (currentPage === 'dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="App">
      <Navbar onGetStarted={openModal} />
      <Hero onGetStarted={openModal} />
      <About />
      <Description />
      <Portfolio onGetStarted={openModal} />
      <Careers onGetStarted={openModal} />
      <Footer />
      <LoginModal isOpen={isModalOpen} onClose={closeModal} onNavigateToDashboard={navigateToDashboard} />
      
      {/* Temporary test button */}
      <button 
        onClick={testJWT}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: 'red',
          color: 'white',
          padding: '10px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test JWT
      </button>
    </div>
  );
}

export default App;
