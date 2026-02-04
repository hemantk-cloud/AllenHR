import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Critical global polyfill for browser environments
// @ts-ignore
window.process = window.process || { env: {} };
// @ts-ignore
window.global = window;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(err => console.error('SW registration failed', err));
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
