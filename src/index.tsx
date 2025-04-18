import React from 'react';
import ReactDOM from 'react-dom/client';
import GameUI from './components/GameUI';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GameUI />
  </React.StrictMode>
); 