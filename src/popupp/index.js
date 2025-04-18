// File: src/popup/index.js
// Description: Entry point for the Creata wallet popup

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import global styles
import './styles.css';

// Render the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);