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
  // Activate scroll-reveal animations globally
  useScrollAnimation();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Function to navigate to dashboard
  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/dashboard');
  };

  useEffect(() => {
    // Capture JWT from OAuth redirect and store
    try {
      const params = new URLSearchParams(window.location.search);
      const jwt = params.get('jwt');
      console.log('🔍 Checking for JWT in URL:', window.location.href);
      console.log('🔍 JWT found:', jwt ? 'Yes' : 'No');
      
      if (jwt) {
        console.log('✅ JWT token received from OAuth:', jwt.substring(0, 20) + '...');
        // Set token in authService singleton
        authService.setToken(jwt);
        console.log('✅ Token set in authService singleton');
        console.log('✅ Current token in authService:', authService.getToken() ? 'Present' : 'Missing');
        // Clear the URL parameters and navigate to dashboard
        window.history.replaceState({}, '', '/dashboard');
        console.log('✅ Navigating to dashboard');
        setCurrentPage('dashboard');
      } else {
        console.log('ℹ️ No JWT found in URL');
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
          console.log('❌ No token found, staying on home');
          setCurrentPage('home');
        }
      } else {
        console.log('🔍 Non-dashboard route, setting to home');
        setCurrentPage('home');
      }
    };

    // Check route on mount (but only if no JWT processing happened)
    if (!window.location.search.includes('jwt=')) {
      checkRoute();
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
  }, [currentPage]);

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
    </div>
  );
}

export default App;
