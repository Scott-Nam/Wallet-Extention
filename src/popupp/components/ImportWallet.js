// File: src/popup/components/ImportWallet.js
// Description: Component for importing an existing wallet

import React, { useState } from 'react';
import { importFromMnemonic, storeWallet } from '../../lib/keyring';
import { isValidMnemonic } from '../../utils/helpers';

/**
 * Import wallet component
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onBack - Back callback
 * @returns {JSX.Element} - Import wallet component
 */
const ImportWallet = ({ onSuccess, onBack }) => {
  // Component state
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mnemonicError, setMnemonicError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Handle mnemonic input
  const handleMnemonicChange = (e) => {
	setMnemonic(e.target.value);
	setMnemonicError(null);
	setError(null);
  };

  // Handle password input
  const handlePasswordChange = (e) => {
	setPassword(e.target.value);
	setPasswordError(null);
	setError(null);
  };

  // Handle confirm password input
  const handleConfirmPasswordChange = (e) => {
	setConfirmPassword(e.target.value);
	setPasswordError(null);
	setError(null);
  };

  // Validate form inputs
  const validateForm = () => {
	let isValid = true;

	// Validate mnemonic
	if (!mnemonic.trim()) {
	  setMnemonicError('Recovery phrase is required');
	  isValid = false;
	} else if (!isValidMnemonic(mnemonic.trim())) {
	  setMnemonicError('Invalid recovery phrase format. Please enter a valid 12/15/18/21/24-word phrase');
	  isValid = false;
	}

	// Validate password
	if (!password) {
	  setPasswordError('Password is required');
	  isValid = false;
	} else if (password.length < 8) {
	  setPasswordError('Password must be at least 8 characters long');
	  isValid = false;
	} else if (password !== confirmPassword) {
	  setPasswordError('Passwords do not match');
	  isValid = false;
	}

	return isValid;
  };

  // Handle import wallet
  const handleImportWallet = async () => {
	try {
	  // Validate form inputs
	  if (!validateForm()) {
		return;
	  }

	  setLoading(true);
	  setError(null);

	  // Clean mnemonic (remove extra spaces, lowercase)
	  const cleanedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');

	  // Import wallet from mnemonic
	  const wallet = await importFromMnemonic(cleanedMnemonic);

	  // Store wallet securely
	  await storeWallet(wallet, password);

	  // Call success callback
	  onSuccess();
	} catch (err) {
	  console.error('Failed to import wallet:', err);
	  setError('Failed to import wallet. Please check your recovery phrase and try again.');
	} finally {
	  setLoading(false);
	}
  };

  return (
	<div className="import-wallet-container">
	  <div className="nav-container">
		<button className="nav-button" onClick={onBack}>
		  Back
		</button>
		<h2 className="nav-title">Import Wallet</h2>
		<div></div>
	  </div>

	  <div className="form-container" style={{ padding: '16px' }}>
		<h3 style={{ marginBottom: '16px' }}>Import from Recovery Phrase</h3>
		<p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
		  Enter your recovery phrase to restore your wallet. This will be a 12 to 24-word phrase you were given when you created your wallet.
		</p>

		<div className="form-group">
		  <label className="form-label">Recovery Phrase</label>
		  <textarea
			className="form-input"
			style={{ 
			  minHeight: '120px', 
			  resize: 'vertical',
			  fontFamily: 'inherit',
			  border: mnemonicError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			}}
			value={mnemonic}
			onChange={handleMnemonicChange}
			placeholder="Enter your recovery phrase, separated by spaces"
		  />
		  {mnemonicError && <p className="form-error">{mnemonicError}</p>}
		</div>

		<div className="form-group">
		  <label className="form-label">New Password</label>
		  <input
			type="password"
			className="form-input"
			style={{
			  border: passwordError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			}}
			value={password}
			onChange={handlePasswordChange}
			placeholder="Enter new password"
		  />
		</div>

		<div className="form-group">
		  <label className="form-label">Confirm Password</label>
		  <input
			type="password"
			className="form-input"
			style={{
			  border: passwordError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			}}
			value={confirmPassword}
			onChange={handleConfirmPasswordChange}
			placeholder="Confirm new password"
		  />
		  {passwordError && <p className="form-error">{passwordError}</p>}
		</div>

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

		<button
		  className="button button-primary"
		  style={{ width: '100%', marginTop: '16px' }}
		  onClick={handleImportWallet}
		  disabled={loading}
		>
		  {loading ? (
			<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			  <span className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
			  Importing...
			</span>
		  ) : (
			'Import Wallet'
		  )}
		</button>
		
		<div style={{ marginTop: '16px', textAlign: 'center' }}>
		  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
			Warning: Never share your recovery phrase with anyone.
		  </p>
		</div>
	  </div>
	</div>
  );
};

export default ImportWallet;