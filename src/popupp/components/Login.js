// File: src/popup/components/Login.js
// Description: Login component for authenticated access to the wallet

import React, { useState, useEffect } from 'react';
import { loadWallet, getAccounts } from '../../lib/keyring';
import { truncateAddress } from '../../utils/helpers';

/**
 * Login component
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Login callback
 * @returns {JSX.Element} - Login component
 */
const Login = ({ onLogin }) => {
  // Component state
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  // Load account info on component mount
  useEffect(() => {
	const fetchAccountInfo = async () => {
	  try {
		// Note: This is just to get the account address for display
		// We're not decrypting the wallet here, so we use a dummy password
		// that will likely fail, but we catch the error and extract info
		const dummyPassword = 'dummy_password_for_address_extraction';
		const accounts = await getAccounts(dummyPassword);
		
		// If we get accounts, use them
		if (accounts && accounts.length > 0) {
		  setAccountInfo({ address: accounts[0].address });
		}
	  } catch (err) {
		// Expected to fail with password error
		// Try to extract account info from extension storage
		try {
		  const data = await chrome.storage.local.get(['creata_accounts_public']);
		  if (data.creata_accounts_public) {
			const accounts = JSON.parse(data.creata_accounts_public);
			if (accounts && accounts.length > 0) {
			  setAccountInfo({ address: accounts[0].address });
			}
		  }
		} catch (storageErr) {
		  console.error('Failed to load account info:', storageErr);
		}
	  }
	};
	
	fetchAccountInfo();
  }, []);
  
  // Handle password input
  const handlePasswordChange = (e) => {
	setPassword(e.target.value);
	setError(null);
  };
  
  // Handle login
  const handleLogin = async () => {
	if (!password) {
	  setError('Password is required');
	  return;
	}
	
	try {
	  setLoading(true);
	  setError(null);
	  
	  // Attempt to load wallet with password
	  await loadWallet(password);
	  
	  // If successful, call login callback
	  onLogin();
	} catch (err) {
	  console.error('Login failed:', err);
	  setAttempts(attempts + 1);
	  
	  // Show different error messages based on number of attempts
	  if (attempts >= 2) {
		setError('Wrong password. Please try again or reset your wallet.');
	  } else {
		setError('Wrong password. Please try again.');
	  }
	} finally {
	  setLoading(false);
	}
  };
  
  // Handle enter key press
  const handleKeyPress = (e) => {
	if (e.key === 'Enter') {
	  handleLogin();
	}
  };
  
  return (
	<div className="login-container">
	  <div className="nav-container">
		<div></div>
		<h2 className="nav-title">Unlock Wallet</h2>
		<div></div>
	  </div>
	  
	  <div className="form-container" style={{ padding: '24px 16px' }}>
		{accountInfo && accountInfo.address && (
		  <div className="account-info" style={{ textAlign: 'center', marginBottom: '24px' }}>
			<div className="account-icon" style={{ 
			  width: '64px', 
			  height: '64px', 
			  borderRadius: '50%', 
			  background: 'var(--background-light)',
			  margin: '0 auto 12px',
			  display: 'flex',
			  alignItems: 'center',
			  justifyContent: 'center',
			  fontSize: '24px',
			  color: 'var(--primary-color)'
			}}>
			  {accountInfo.address.charAt(1).toUpperCase()}
			</div>
			<p className="account-address" style={{ 
			  fontSize: '14px', 
			  fontWeight: '500',
			  color: 'var(--text-light)' 
			}}>
			  {truncateAddress(accountInfo.address, 8, 6)}
			</p>
		  </div>
		)}
		
		<h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Enter Your Password</h3>
		
		<div className="form-group">
		  <input
			type="password"
			className="form-input"
			value={password}
			onChange={handlePasswordChange}
			onKeyPress={handleKeyPress}
			placeholder="Password"
			style={{ 
			  fontSize: '16px',
			  textAlign: 'center',
			  padding: '12px',
			  border: error ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			}}
			autoFocus
		  />
		  {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
		</div>
		
		<button
		  className="button button-primary"
		  style={{ width: '100%', marginTop: '24px', padding: '12px' }}
		  onClick={handleLogin}
		  disabled={loading || !password}
		>
		  {loading ? (
			<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			  <span className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
			  Unlocking...
			</span>
		  ) : (
			'Unlock'
		  )}
		</button>
		
		{attempts >= 2 && (
		  <div style={{ marginTop: '24px', textAlign: 'center' }}>
			<a
			  href="#"
			  style={{ 
				color: 'var(--text-light)', 
				textDecoration: 'none',
				fontSize: '14px'
			  }}
			  onClick={(e) => {
				e.preventDefault();
				// Handle wallet reset
				if (confirm('Are you sure you want to reset your wallet? You will need your recovery phrase to restore it.')) {
				  chrome.storage.local.clear(() => {
					window.location.reload();
				  });
				}
			  }}
			>
			  Reset Wallet
			</a>
		  </div>
		)}
	  </div>
	</div>
  );
};

export default Login;