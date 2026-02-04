import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Relative path for same-origin registration
    const swUrl = './sw.js';
    
    // Attempt registration. If it fails due to sandbox restrictions, log but don't crash.
    navigator.serviceWorker.register(swUrl, { scope: './' })
      .then(registration => {
        console.log('AllenHR: SW registered successfully', registration.scope);
      })
      .catch(err => {
        console.warn('AllenHR: Service Worker registration skipped (not supported in this environment):', err.message);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
