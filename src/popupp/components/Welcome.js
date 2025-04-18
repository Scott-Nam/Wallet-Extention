// File: src/popup/components/Welcome.js
// Description: Welcome component for new users

import React from 'react';

/**
 * Welcome component for new users
 * @param {Object} props - Component props
 * @param {Function} props.onCreateWallet - Create wallet callback
 * @param {Function} props.onImportWallet - Import wallet callback
 * @returns {JSX.Element} - Welcome component
 */
const Welcome = ({ onCreateWallet, onImportWallet }) => {
  return (
	<div className="welcome-container">
	  <div className="welcome-logo">
		{/* Placeholder for logo */}
		<svg
		  width="120"
		  height="120"
		  viewBox="0 0 120 120"
		  fill="none"
		  xmlns="http://www.w3.org/2000/svg"
		>
		  <circle cx="60" cy="60" r="60" fill="#0052cc" fillOpacity="0.1" />
		  <path
			d="M40 40L80 80M40 80L80 40"
			stroke="#0052cc"
			strokeWidth="8"
			strokeLinecap="round"
		  />
		</svg>
	  </div>

	  <h1 className="welcome-title">Welcome to Creata Wallet</h1>
	  <p className="welcome-subtitle">
		The secure wallet for the Creata blockchain ecosystem
	  </p>

	  <div className="welcome-buttons">
		<button
		  className="button button-primary"
		  onClick={onCreateWallet}
		>
		  Create New Wallet
		</button>
		<button
		  className="button button-secondary"
		  onClick={onImportWallet}
		>
		  Import Existing Wallet
		</button>
	  </div>

	  <div className="welcome-terms" style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-light)' }}>
		<p>
		  By continuing, you agree to our Terms of Service and Privacy Policy.
		</p>
	  </div>
	</div>
  );
};

export default Welcome;