// File: src/popup/components/Settings.js
// Description: Settings component for wallet configuration

import React, { useState, useEffect } from 'react';
import { removeWallet, getAccounts, getCurrentAccount, setCurrentAccount } from '../../lib/keyring';
import { truncateAddress } from '../../utils/helpers';
import { networks } from '../../config/network';

/**
 * Settings component
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Back callback
 * @param {Function} props.onLogout - Logout callback
 * @returns {JSX.Element} - Settings component
 */
const Settings = ({ onBack, onLogout }) => {
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccountState] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalContent, setInfoModalContent] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalContent, setConfirmModalContent] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(null);
  
  // Load settings data on component mount
  useEffect(() => {
	let mounted = true;
	const loadData = async () => {
	  try {
		setLoading(true);
		
		// Get active network from storage
		const networkData = await chrome.storage.local.get(['creata_active_network']);
		const activeNetwork = networkData.creata_active_network || 'mainnet';
		if (mounted) setNetwork(activeNetwork);
		
		// Get session timeout from storage
		const timeoutData = await chrome.storage.local.get(['creata_session_timeout']);
		const timeout = timeoutData.creata_session_timeout || 30;
		if (mounted) setSessionTimeout(timeout);
		
		// Get current session password from storage
		const sessionData = await chrome.storage.local.get(['creata_session']);
		const password = sessionData.creata_session || '';
		
		// Get all accounts
		const accountsList = await getAccounts(password);
		if (mounted) setAccounts(accountsList || []);
		
		// Get current account
		const currentAcc = await getCurrentAccount(password);
		if (mounted) setCurrentAccountState(currentAcc);
	  } catch (err) {
		console.error('Failed to load settings data:', err);
		if (mounted) setError('Failed to load settings. Please try again.');
	  } finally {
		if (mounted) setLoading(false);
	  }
	};
	
	loadData();
	
	return () => {
	  mounted = false;
	};
  }, []);
  
  // Handle network change
  const handleNetworkChange = async (e) => {
	const newNetwork = e.target.value;
	setNetwork(newNetwork);
	
	// Save to storage
	await chrome.storage.local.set({ creata_active_network: newNetwork });
  };
  
  // Handle session timeout change
  const handleSessionTimeoutChange = async (e) => {
	const timeout = parseInt(e.target.value);
	setSessionTimeout(timeout);
	
	// Save to storage
	await chrome.storage.local.set({ creata_session_timeout: timeout });
  };
  
  // Handle account switch
  const handleAccountSwitch = async (address) => {
	try {
	  // Get current session password from storage
	  const sessionData = await chrome.storage.local.get(['creata_session']);
	  const password = sessionData.creata_session || '';
	  
	  // Set current account
	  await setCurrentAccount(address, password);
	  setCurrentAccountState(address);
	  
	  // Show success info
	  showInfoModal('Account Switched', 'Your active account has been changed successfully.');
	} catch (err) {
	  console.error('Failed to switch account:', err);
	  setError('Failed to switch account. Please try again.');
	}
  };
  
  // Handle reset wallet
  const handleResetWallet = () => {
	showConfirmModal(
	  'Reset Wallet',
	  'This will remove all your wallet data from this device. Make sure you have your recovery phrase before continuing.',
	  async () => {
		try {
		  // Remove wallet data
		  await removeWallet();
		  
		  // Clear storage
		  await chrome.storage.local.clear();
		  
		  // Reload extension
		  window.location.reload();
		} catch (err) {
		  console.error('Failed to reset wallet:', err);
		  setError('Failed to reset wallet. Please try again.');
		}
	  }
	);
  };
  
  // Show info modal
  const showInfoModal = (title, content) => {
	setInfoModalTitle(title);
	setInfoModalContent(content);
	setInfoModalOpen(true);
  };
  
  // Close info modal
  const closeInfoModal = () => {
	setInfoModalOpen(false);
  };
  
  // Show confirm modal
  const showConfirmModal = (title, content, action) => {
	setConfirmModalTitle(title);
	setConfirmModalContent(content);
	setConfirmModalAction(() => action);
	setConfirmModalOpen(true);
  };
  
  // Close confirm modal
  const closeConfirmModal = () => {
	setConfirmModalOpen(false);
  };
  
  // Handle confirm action
  const handleConfirmAction = () => {
	if (confirmModalAction) {
	  confirmModalAction();
	}
	closeConfirmModal();
  };
  
  // Render loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading settings...</p>
	  </div>
	);
  }
  
  return (
	<div className="settings-container">
	  <div className="nav-container">
		<button className="nav-button" onClick={onBack}>
		  Back
		</button>
		<h2 className="nav-title">Settings</h2>
		<div></div>
	  </div>
	  
	  <div className="settings-content" style={{ padding: '16px' }}>
		{error && (
		  <div className="error-message" style={{ 
			background: '#fff1f0', 
			border: '1px solid #ffccc7',
			borderRadius: '4px',
			padding: '12px',
			marginBottom: '16px',
			color: 'var(--danger-color)'
		  }}>
			{error}
		  </div>
		)}
		
		<div className="settings-section">
		  <h3 style={{ marginBottom: '16px' }}>Network</h3>
		  <div className="form-group">
			<label className="form-label">Active Network</label>
			<select
			  className="form-input"
			  value={network}
			  onChange={handleNetworkChange}
			>
			  <option value="mainnet">Mainnet</option>
			  <option value="testnet">Testnet</option>
			</select>
		  </div>
		</div>
		
		<div className="settings-section" style={{ marginTop: '24px' }}>
		  <h3 style={{ marginBottom: '16px' }}>Security</h3>
		  <div className="form-group">
			<label className="form-label">Auto-lock after inactivity (minutes)</label>
			<select
			  className="form-input"
			  value={sessionTimeout}
			  onChange={handleSessionTimeoutChange}
			>
			  <option value="5">5 minutes</option>
			  <option value="15">15 minutes</option>
			  <option value="30">30 minutes</option>
			  <option value="60">1 hour</option>
			  <option value="120">2 hours</option>
			</select>
		  </div>
		  
		  <div className="form-group" style={{ marginTop: '16px' }}>
			<button
			  className="button button-secondary"
			  style={{ width: '100%' }}
			  onClick={() => {
				// Show recovery phrase (in a real app, this would need password confirmation)
				showInfoModal(
				  'View Recovery Phrase',
				  'For security reasons, this feature requires additional verification. Please reset your wallet and import it again using your recovery phrase.'
				);
			  }}
			>
			  View Recovery Phrase
			</button>
		  </div>
		</div>
		
		<div className="settings-section" style={{ marginTop: '24px' }}>
		  <h3 style={{ marginBottom: '16px' }}>Accounts</h3>
		  
		  {accounts.length === 0 ? (
			<p style={{ color: 'var(--text-light)' }}>No accounts found</p>
		  ) : (
			<div className="accounts-list">
			  {accounts.map((account, index) => (
				<div
				  key={index}
				  className="account-item"
				  style={{
					display: 'flex',
					alignItems: 'center',
					padding: '12px',
					borderRadius: '8px',
					background: account.address === currentAccount ? 'var(--background-light)' : 'transparent',
					marginBottom: '8px',
					cursor: 'pointer'
				  }}
				  onClick={() => handleAccountSwitch(account.address)}
				>
				  <div
					className="account-icon"
					style={{
					  width: '36px',
					  height: '36px',
					  borderRadius: '50%',
					  background: 'var(--primary-color)',
					  display: 'flex',
					  alignItems: 'center',
					  justifyContent: 'center',
					  marginRight: '12px',
					  color: 'white',
					  fontSize: '16px'
					}}
				  >
					{index + 1}
				  </div>
				  
				  <div style={{ flex: 1 }}>
					<div style={{ fontWeight: '500' }}>Account {index + 1}</div>
					<div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
					  {truncateAddress(account.address, 10, 6)}
					</div>
				  </div>
				  
				  {account.address === currentAccount && (
					<div
					  style={{
						background: 'var(--success-color)',
						color: 'white',
						fontSize: '10px',
						padding: '2px 6px',
						borderRadius: '4px'
					  }}
					>
					  Active
					</div>
				  )}
				</div>
			  ))}
			</div>
		  )}
		</div>
		
		<div className="settings-section" style={{ marginTop: '24px' }}>
		  <h3 style={{ marginBottom: '16px' }}>About</h3>
		  <div className="about-info" style={{ fontSize: '14px' }}>
			<p><strong>Creata Wallet</strong></p>
			<p style={{ marginTop: '8px', color: 'var(--text-light)' }}>Version: 0.1.0</p>
			<p style={{ marginTop: '4px', color: 'var(--text-light)' }}>
			  A secure wallet for the Creata blockchain ecosystem
			</p>
		  </div>
		</div>
		
		<div className="settings-section" style={{ marginTop: '32px' }}>
		  <div className="danger-zone" style={{ 
			border: '1px solid var(--danger-color)',
			borderRadius: '8px',
			padding: '16px'
		  }}>
			<h3 style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>Danger Zone</h3>
			
			<button
			  className="button button-danger"
			  style={{ width: '100%' }}
			  onClick={handleResetWallet}
			>
			  Reset Wallet
			</button>
			
			<p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
			  This will remove all your wallet data from this device. Make sure you have your recovery phrase before continuing.
			</p>
		  </div>
		</div>
	  </div>
	  
	  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', background: 'white', borderTop: '1px solid var(--border-color)' }}>
		<button
		  className="button button-secondary"
		  style={{ width: '100%' }}
		  onClick={onLogout}
		>
		  Lock Wallet
		</button>
	  </div>
	  
	  {/* Info Modal */}
	  {infoModalOpen && (
		<div className="modal-overlay" style={{
		  position: 'fixed',
		  top: 0,
		  left: 0,
		  right: 0,
		  bottom: 0,
		  backgroundColor: 'rgba(0, 0, 0, 0.5)',
		  display: 'flex',
		  alignItems: 'center',
		  justifyContent: 'center',
		  zIndex: 10
		}}>
		  <div className="modal-content" style={{
			background: 'white',
			borderRadius: '8px',
			width: '90%',
			maxWidth: '320px',
			padding: '24px',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
		  }}>
			<h3 style={{ marginBottom: '16px' }}>{infoModalTitle}</h3>
			<p style={{ marginBottom: '24px' }}>{infoModalContent}</p>
			
			<button
			  className="button button-primary"
			  style={{ width: '100%' }}
			  onClick={closeInfoModal}
			>
			  OK
			</button>
		  </div>
		</div>
	  )}
	  
	  {/* Confirm Modal */}
	  {confirmModalOpen && (
		<div className="modal-overlay" style={{
		  position: 'fixed',
		  top: 0,
		  left: 0,
		  right: 0,
		  bottom: 0,
		  backgroundColor: 'rgba(0, 0, 0, 0.5)',
		  display: 'flex',
		  alignItems: 'center',
		  justifyContent: 'center',
		  zIndex: 10
		}}>
		  <div className="modal-content" style={{
			background: 'white',
			borderRadius: '8px',
			width: '90%',
			maxWidth: '320px',
			padding: '24px',
			boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
		  }}>
			<h3 style={{ marginBottom: '16px', color: 'var(--danger-color)' }}>{confirmModalTitle}</h3>
			<p style={{ marginBottom: '24px' }}>{confirmModalContent}</p>
			
			<div style={{ display: 'flex', gap: '16px' }}>
			  <button
				className="button button-secondary"
				style={{ flex: 1 }}
				onClick={closeConfirmModal}
			  >
				Cancel
			  </button>
			  
			  <button
				className="button button-danger"
				style={{ flex: 1 }}
				onClick={handleConfirmAction}
			  >
				Confirm
			  </button>
			</div>
		  </div>
		</div>
	  )}
	</div>
  );
};

export default Settings;