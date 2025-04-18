// File: src/popup/App.js
// Description: Main App component for the Creata wallet extension

import React, { useState, useEffect } from 'react';
import { hasWallet } from '../lib/keyring';

// Import all components
import Welcome from './components/Welcome';
import CreateWallet from './components/CreateWallet';
import ImportWallet from './components/ImportWallet';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import Receive from './components/Receive';
import Settings from './components/Settings';
import Stake from './components/Stake';

/**
 * Main App component
 */
const App = () => {
  // Application state
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [error, setError] = useState(null);
  
  // Check if wallet exists on startup
  useEffect(() => {
	const checkWallet = async () => {
	  try {
		setLoading(true);
		const walletExists = await hasWallet();
		setInitialized(walletExists);
		setCurrentPage(walletExists ? 'login' : 'welcome');
	  } catch (err) {
		console.error('Error checking wallet:', err);
		setError('Failed to initialize wallet');
	  } finally {
		setLoading(false);
	  }
	};
	
	checkWallet();
  }, []);
  
  // Handle login
  const handleLogin = () => {
	setAuthenticated(true);
	setCurrentPage('dashboard');
  };
  
  // Handle logout
  const handleLogout = () => {
	setAuthenticated(false);
	setCurrentPage('login');
  };
  
  // Navigate to page
  const navigateTo = (page) => {
	setCurrentPage(page);
  };
  
  // Loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading...</p>
	  </div>
	);
  }
  
  // Error state
  if (error) {
	return (
	  <div className="error-container">
		<h3>Error</h3>
		<p>{error}</p>
		<button onClick={() => setError(null)}>Try Again</button>
	  </div>
	);
  }
  
  // Render current page
  const renderPage = () => {
	switch (currentPage) {
	  case 'welcome':
		return <Welcome onCreateWallet={() => navigateTo('create')} onImportWallet={() => navigateTo('import')} />;
	  case 'create':
		return <CreateWallet onSuccess={() => navigateTo('dashboard')} onBack={() => navigateTo('welcome')} />;
	  case 'import':
		return <ImportWallet onSuccess={() => navigateTo('dashboard')} onBack={() => navigateTo('welcome')} />;
	  case 'login':
		return <Login onLogin={handleLogin} />;
	  case 'dashboard':
		return (
		  <Dashboard 
			onSend={() => navigateTo('send')} 
			onReceive={() => navigateTo('receive')} 
			onStake={() => navigateTo('stake')}
			onSettings={() => navigateTo('settings')}
			onLogout={handleLogout}
		  />
		);
	  case 'send':
		return <Send onBack={() => navigateTo('dashboard')} />;
	  case 'receive':
		return <Receive onBack={() => navigateTo('dashboard')} />;
	  case 'stake':
		return <Stake onBack={() => navigateTo('dashboard')} />;
	  case 'settings':
		return <Settings onBack={() => navigateTo('dashboard')} onLogout={handleLogout} />;
	  default:
		return <div>Page not found</div>;
	}
  };
  
  return (
	<div className="app-container">
	  <div className="app-content">
		{renderPage()}
	  </div>
	</div>
  );
};

export default App;