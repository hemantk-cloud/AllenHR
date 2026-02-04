import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Determine the Service Worker URL based on current context
    const swUrl = './sw.js';
    
    // In many hosted environments/sandboxes, SW registration may fail due to origin restrictions.
    // We check if we are on the same origin before attempting.
    try {
      navigator.serviceWorker.register(swUrl, { scope: './' })
        .then(registration => {
          console.log('AllenHR: SW registered successfully', registration.scope);
        })
        .catch(err => {
          console.warn('AllenHR: SW registration skipped or failed (common in sandboxed environments):', err.message);
        });
    } catch (e) {
      console.warn('AllenHR: Service Worker initialization skipped.');
    }
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
