// File: src/popup/components/Receive.js
// Description: Component for receiving tokens (displaying address with QR code)

import React, { useState, useEffect } from 'react';
import { getCurrentAccount } from '../../lib/keyring';
import { copyToClipboard } from '../../utils/helpers';

/**
 * Receive component
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Back callback
 * @returns {JSX.Element} - Receive component
 */
const Receive = ({ onBack }) => {
  // Component state
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Load account address on component mount
  useEffect(() => {
	const loadAddress = async () => {
	  try {
		setLoading(true);
		
		// Get current session password from storage
		const sessionData = await chrome.storage.local.get(['creata_session']);
		const password = sessionData.creata_session || '';
		
		// Get current account address
		const currentAccount = await getCurrentAccount(password);
		setAddress(currentAccount);
	  } catch (err) {
		console.error('Failed to load address:', err);
		setError('Failed to load wallet address. Please try again.');
	  } finally {
		setLoading(false);
	  }
	};
	
	loadAddress();
  }, []);
  
  // Handle copy address
  const handleCopyAddress = async () => {
	if (!address) return;
	
	const success = await copyToClipboard(address);
	if (success) {
	  setCopied(true);
	  setTimeout(() => setCopied(false), 2000);
	}
  };
  
  // Generate QR code SVG
  const generateQR = (text) => {
	// Simple implementation for illustration
	// In a production app, use a proper QR code library
	return `
	  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
		<rect x="0" y="0" width="200" height="200" fill="white" />
		<text x="100" y="100" text-anchor="middle" font-size="10">
		  ${text ? text.substring(0, 20) + '...' : 'Address QR Code'}
		</text>
	  </svg>
	`;
  };
  
  // Render loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading your address...</p>
	  </div>
	);
  }
  
  // Render error state
  if (error) {
	return (
	  <div className="error-container">
		<h3>Error</h3>
		<p>{error}</p>
		<button className="button button-primary" onClick={onBack}>Go Back</button>
	  </div>
	);
  }
  
  return (
	<div className="receive-container">
	  <div className="nav-container">
		<button className="nav-button" onClick={onBack}>
		  Back
		</button>
		<h2 className="nav-title">Receive</h2>
		<div></div>
	  </div>
	  
	  <div className="form-container" style={{ padding: '24px 16px', textAlign: 'center' }}>
		<h3 style={{ marginBottom: '16px' }}>Your Wallet Address</h3>
		<p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
		  Share this address to receive CTA tokens
		</p>
		
		<div className="qr-container" style={{ 
		  maxWidth: '250px', 
		  margin: '0 auto 24px',
		  padding: '16px',
		  background: 'white',
		  borderRadius: '8px',
		  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
		}}>
		  <div dangerouslySetInnerHTML={{ __html: generateQR(address) }} />
		</div>
		
		<div className="address-display" style={{ 
		  background: 'var(--background-light)',
		  padding: '12px',
		  borderRadius: '8px',
		  wordBreak: 'break-all',
		  fontSize: '14px',
		  marginBottom: '24px'
		}}>
		  {address}
		</div>
		
		<button
		  className="button button-primary"
		  style={{ width: '100%' }}
		  onClick={handleCopyAddress}
		>
		  {copied ? 'Copied!' : 'Copy Address'}
		</button>
		
		<div style={{ marginTop: '36px' }}>
		  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
			Only send CTA tokens to this address. Sending other assets may result in permanent loss.
		  </p>
		</div>
	  </div>
	</div>
  );
};

export default Receive;