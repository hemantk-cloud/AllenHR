import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA functionality using relative path
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using './sw.js' ensures the service worker is registered from the same origin
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => console.log('AllenHR: SW registered successfully', registration.scope))
      .catch(err => console.error('AllenHR: SW registration failed', err));
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
