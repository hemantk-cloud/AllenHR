import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the absolute path relative to the current origin to avoid origin mismatch errors
    const swUrl = new URL('./sw.js', window.location.href).href;
    
    // Only attempt registration if the origins match, otherwise log a clearer message
    if (new URL(swUrl).origin === window.location.origin) {
      navigator.serviceWorker.register(swUrl, { scope: './' })
        .then(registration => console.log('AllenHR: SW registered successfully', registration.scope))
        .catch(err => console.warn('AllenHR: SW registration skipped or failed', err.message));
    } else {
      console.warn('AllenHR: SW registration skipped due to origin mismatch in sandbox environment.');
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
