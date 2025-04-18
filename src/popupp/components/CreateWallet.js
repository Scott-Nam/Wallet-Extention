// File: src/popup/components/CreateWallet.js
// Description: Component for creating a new wallet

import React, { useState, useEffect } from 'react';
import { generateWallet, storeWallet } from '../../lib/keyring';
import { copyToClipboard } from '../../utils/helpers';

/**
 * Create wallet component
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onBack - Back callback
 * @returns {JSX.Element} - Create wallet component
 */
const CreateWallet = ({ onSuccess, onBack }) => {
  // Component state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [verificationWords, setVerificationWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  
  // Generate mnemonic on component mount
  useEffect(() => {
	const createWallet = async () => {
	  try {
		setLoading(true);
		const wallet = await generateWallet();
		const walletMnemonic = wallet.mnemonic;
		setMnemonic(walletMnemonic);
	  } catch (err) {
		console.error('Failed to generate wallet:', err);
		setError('Failed to generate wallet. Please try again.');
	  } finally {
		setLoading(false);
	  }
	};
	
	createWallet();
  }, []);
  
  // Setup verification words when moving to verification step
  useEffect(() => {
	if (step === 3 && mnemonic) {
	  // Get all words from mnemonic
	  const allWords = mnemonic.split(' ');
	  
	  // Select 4 random words for verification
	  const indices = [];
	  while (indices.length < 4) {
		const randomIndex = Math.floor(Math.random() * allWords.length);
		if (!indices.includes(randomIndex)) {
		  indices.push(randomIndex);
		}
	  }
	  
	  // Create verification words with their indices
	  const wordsWithIndices = indices.map(index => ({
		index,
		word: allWords[index],
		position: index + 1
	  }));
	  
	  setVerificationWords(wordsWithIndices);
	}
  }, [step, mnemonic]);
  
  // Handle password validation
  const validatePassword = () => {
	if (password.length < 8) {
	  setError('Password must be at least 8 characters long');
	  return false;
	}
	
	if (password !== confirmPassword) {
	  setError('Passwords do not match');
	  return false;
	}
	
	setError(null);
	return true;
  };
  
  // Handle mnemonic verification
  const handleWordSelect = (word) => {
	setSelectedWords([...selectedWords, word]);
  };
  
  const handleWordRemove = (index) => {
	setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };
  
  // Verify selected words match verification words
  const verifyMnemonic = () => {
	if (selectedWords.length !== verificationWords.length) {
	  setError('Please select all required words');
	  return false;
	}
	
	for (let i = 0; i < verificationWords.length; i++) {
	  if (selectedWords[i] !== verificationWords[i].word) {
		setError('Selected words do not match your recovery phrase');
		return false;
	  }
	}
	
	setError(null);
	return true;
  };
  
  // Handle final wallet creation
  const handleCreateWallet = async () => {
	try {
	  setLoading(true);
	  
	  // Import wallet from mnemonic
	  const wallet = await generateWallet();
	  
	  // Store wallet securely
	  await storeWallet(wallet, password);
	  
	  // Call success callback
	  onSuccess();
	} catch (err) {
	  console.error('Failed to create wallet:', err);
	  setError('Failed to create wallet. Please try again.');
	} finally {
	  setLoading(false);
	}
  };
  
  // Handle next step
  const handleNextStep = () => {
	if (step === 1) {
	  if (validatePassword()) {
		setStep(2);
	  }
	} else if (step === 2) {
	  setStep(3);
	} else if (step === 3) {
	  if (verifyMnemonic()) {
		handleCreateWallet();
	  }
	}
  };
  
  // Handle copy mnemonic
  const handleCopyMnemonic = async () => {
	const success = await copyToClipboard(mnemonic);
	if (success) {
	  alert('Recovery phrase copied to clipboard');
	} else {
	  alert('Failed to copy recovery phrase');
	}
  };
  
  // Render loading state
  if (loading && step === 1) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Generating your wallet...</p>
	  </div>
	);
  }
  
  // Render error state
  if (error && !loading && step === 1) {
	return (
	  <div className="error-container">
		<h3>Error</h3>
		<p>{error}</p>
		<button className="button button-primary" onClick={onBack}>Go Back</button>
	  </div>
	);
  }
  
  // Render step 1: Set password
  if (step === 1) {
	return (
	  <div className="create-wallet-container">
		<div className="nav-container">
		  <button className="nav-button" onClick={onBack}>Back</button>
		  <h2 className="nav-title">Create Wallet</h2>
		  <div></div>
		</div>
		
		<div className="form-container" style={{ padding: '16px' }}>
		  <h3 style={{ marginBottom: '16px' }}>Set Your Password</h3>
		  <p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
			This password will be used to unlock your wallet and confirm transactions.
		  </p>
		  
		  <div className="form-group">
			<label className="form-label">Password</label>
			<input
			  type="password"
			  className="form-input"
			  value={password}
			  onChange={(e) => setPassword(e.target.value)}
			  placeholder="Enter password"
			/>
		  </div>
		  
		  <div className="form-group">
			<label className="form-label">Confirm Password</label>
			<input
			  type="password"
			  className="form-input"
			  value={confirmPassword}
			  onChange={(e) => setConfirmPassword(e.target.value)}
			  placeholder="Confirm password"
			/>
		  </div>
		  
		  {error && <p className="form-error">{error}</p>}
		  
		  <button
			className="button button-primary"
			style={{ width: '100%', marginTop: '24px' }}
			onClick={handleNextStep}
			disabled={!password || !confirmPassword}
		  >
			Next
		  </button>
		</div>
	  </div>
	);
  }
  
  // Render step 2: Show mnemonic
  if (step === 2) {
	return (
	  <div className="create-wallet-container">
		<div className="nav-container">
		  <button className="nav-button" onClick={() => setStep(1)}>Back</button>
		  <h2 className="nav-title">Recovery Phrase</h2>
		  <div></div>
		</div>
		
		<div className="form-container" style={{ padding: '16px' }}>
		  <h3 style={{ marginBottom: '16px' }}>Your Recovery Phrase</h3>
		  <p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
			Write down these 24 words in order and keep them in a safe place. This phrase is the only way to recover your wallet.
		  </p>
		  
		  <div className="mnemonic-container" style={{ 
			background: 'var(--background-light)',
			padding: '16px',
			borderRadius: '8px',
			marginBottom: '16px',
			position: 'relative'
		  }}>
			{!showMnemonic ? (
			  <div className="mnemonic-blur" style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '150px',
				textAlign: 'center'
			  }}>
				<p>Your recovery phrase is hidden for security</p>
				<button
				  className="button button-secondary"
				  style={{ marginTop: '16px' }}
				  onClick={() => setShowMnemonic(true)}
				>
				  Show Recovery Phrase
				</button>
			  </div>
			) : (
			  <div className="mnemonic-words" style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(3, 1fr)',
				gap: '8px'
			  }}>
				{mnemonic.split(' ').map((word, index) => (
				  <div key={index} style={{
					display: 'flex',
					alignItems: 'center',
					padding: '4px 8px',
					border: '1px solid var(--border-color)',
					borderRadius: '4px',
					background: 'white'
				  }}>
					<span style={{ color: 'var(--text-light)', marginRight: '8px' }}>{index + 1}.</span>
					<span>{word}</span>
				  </div>
				))}
			  </div>
			)}
		  </div>
		  
		  <div className="mnemonic-actions" style={{ display: 'flex', gap: '8px' }}>
			<button
			  className="button button-secondary"
			  style={{ flex: 1 }}
			  onClick={handleCopyMnemonic}
			>
			  Copy
			</button>
			<button
			  className="button button-primary"
			  style={{ flex: 1 }}
			  onClick={handleNextStep}
			>
			  I've Written It Down
			</button>
		  </div>
		</div>
	  </div>
	);
  }
  
  // Render step 3: Verify mnemonic
  if (step === 3) {
	// Get all words from mnemonic for shuffled options
	const allWords = mnemonic.split(' ');
	
	// Shuffle options
	const shuffledOptions = [...allWords]
	  .sort(() => Math.random() - 0.5)
	  .filter((word, index, array) => array.indexOf(word) === index)
	  .slice(0, 12); // Take 12 random words
	  
	// Ensure all verification words are included in options
	verificationWords.forEach(({ word }) => {
	  if (!shuffledOptions.includes(word)) {
		shuffledOptions.splice(Math.floor(Math.random() * shuffledOptions.length), 1, word);
	  }
	});
	
	// Final shuffle of options
	const finalOptions = shuffledOptions.sort(() => Math.random() - 0.5);
	
	return (
	  <div className="create-wallet-container">
		<div className="nav-container">
		  <button className="nav-button" onClick={() => setStep(2)}>Back</button>
		  <h2 className="nav-title">Verify Recovery Phrase</h2>
		  <div></div>
		</div>
		
		<div className="form-container" style={{ padding: '16px' }}>
		  <h3 style={{ marginBottom: '16px' }}>Verify Your Recovery Phrase</h3>
		  <p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
			Select the following words from your recovery phrase:
		  </p>
		  
		  <div className="verification-prompts" style={{ marginBottom: '16px' }}>
			{verificationWords.map(({ position }, index) => (
			  <div key={index} style={{ marginBottom: '8px' }}>
				<span style={{ fontWeight: 500 }}>Word #{position}:</span>
				<span style={{ marginLeft: '8px' }}>
				  {selectedWords[index] ? selectedWords[index] : '___________'}
				</span>
			  </div>
			))}
		  </div>
		  
		  <div className="word-options" style={{
			display: 'grid',
			gridTemplateColumns: 'repeat(3, 1fr)',
			gap: '8px',
			marginBottom: '24px'
		  }}>
			{finalOptions.map((word, index) => (
			  <button
				key={index}
				className="button button-secondary"
				style={{
				  padding: '8px 4px',
				  fontSize: '12px',
				  opacity: selectedWords.includes(word) ? 0.5 : 1,
				}}
				onClick={() => {
				  if (!selectedWords.includes(word) && selectedWords.length < verificationWords.length) {
					handleWordSelect(word);
				  }
				}}
				disabled={selectedWords.includes(word)}
			  >
				{word}
			  </button>
			))}
		  </div>
		  
		  <div className="selected-words" style={{ marginBottom: '16px' }}>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
			  {selectedWords.map((word, index) => (
				<div key={index} style={{
				  display: 'flex',
				  alignItems: 'center',
				  padding: '4px 8px',
				  background: 'var(--primary-color)',
				  color: 'white',
				  borderRadius: '4px',
				  fontSize: '12px'
				}}>
				  <span>{word}</span>
				  <button
					style={{
					  background: 'none',
					  border: 'none',
					  color: 'white',
					  marginLeft: '4px',
					  cursor: 'pointer',
					  fontSize: '14px'
					}}
					onClick={() => handleWordRemove(index)}
				  >
					×
				  </button>
				</div>
			  ))}
			</div>
		  </div>
		  
		  <div className="form-group" style={{ marginBottom: '24px' }}>
			<label style={{ display: 'flex', alignItems: 'center' }}>
			  <input
				type="checkbox"
				checked={confirmChecked}
				onChange={(e) => setConfirmChecked(e.target.checked)}
				style={{ marginRight: '8px' }}
			  />
			  <span>
				I understand that if I lose my recovery phrase, I will not be able to access my wallet
			  </span>
			</label>
		  </div>
		  
		  {error && <p className="form-error">{error}</p>}
		  
		  <button
			className="button button-primary"
			style={{ width: '100%' }}
			onClick={handleNextStep}
			disabled={selectedWords.length !== verificationWords.length || !confirmChecked || loading}
		  >
			{loading ? 'Creating Wallet...' : 'Create Wallet'}
		  </button>
		</div>
	  </div>
	);
  }
  
  return null;
};

export default CreateWallet;