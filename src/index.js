import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #05050f;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { display: none; }
  button { outline: none; }
  input { outline: none; }
  canvas { display: block; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
