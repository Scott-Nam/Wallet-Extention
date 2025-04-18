// File: src/popup/components/Send.js
// Description: Component for sending tokens to another address

import React, { useState, useEffect } from 'react';
import { loadWallet, getCurrentAccount } from '../../lib/keyring';
import { sendTokens } from '../../lib/transactions';
import CreataApiClient from '../../lib/api';
import { formatAmount, parseAmount, isValidAddress } from '../../utils/helpers';
import { networks } from '../../config/network';

/**
 * Send component
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Back callback
 * @returns {JSX.Element} - Send component
 */
const Send = ({ onBack }) => {
  // Component state
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [addressError, setAddressError] = useState(null);
  const [amountError, setAmountError] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState('mainnet');
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Load wallet data on component mount
  useEffect(() => {
	let mounted = true;
	const loadData = async () => {
	  try {
		setLoading(true);
		
		// Get active network from storage
		const networkData = await chrome.storage.local.get(['creata_active_network']);
		const activeNetwork = networkData.creata_active_network || 'mainnet';
		if (mounted) setNetwork(activeNetwork);
		
		// Get current session password from storage
		const sessionData = await chrome.storage.local.get(['creata_session']);
		const password = sessionData.creata_session || '';
		
		// Load wallet and account
		const walletInstance = await loadWallet(password);
		if (mounted) setWallet(walletInstance);
		
		const currentAccount = await getCurrentAccount(password);
		if (mounted) setAddress(currentAccount);
		
		// Create API client
		const apiClient = new CreataApiClient(activeNetwork);
		
		// Get account balance
		const balanceAmount = await apiClient.getBalance(currentAccount);
		if (mounted) setBalance(balanceAmount);
	  } catch (err) {
		console.error('Failed to load send data:', err);
		if (mounted) setError('Failed to load wallet data. Please try again.');
	  } finally {
		if (mounted) setLoading(false);
	  }
	};
	
	loadData();
	
	return () => {
	  mounted = false;
	};
  }, []);
  
  // Handle recipient address change
  const handleAddressChange = (e) => {
	setRecipientAddress(e.target.value);
	setAddressError(null);
	setError(null);
  };
  
  // Handle amount change
  const handleAmountChange = (e) => {
	setAmount(e.target.value);
	setAmountError(null);
	setError(null);
  };
  
  // Handle memo change
  const handleMemoChange = (e) => {
	setMemo(e.target.value);
	setError(null);
  };
  
  // Handle max amount button
  const handleMaxAmount = () => {
	// Set amount to max balance (leave some for gas)
	const maxAmount = formatAmount(
	  Math.max(0, Number(balance) - 100000), // Reserve 0.1 CTA for gas
	  networks[network].decimals
	);
	setAmount(maxAmount);
	setAmountError(null);
  };
  
  // Validate form inputs
  const validateForm = () => {
	let isValid = true;
	
	// Validate recipient address
	if (!recipientAddress.trim()) {
	  setAddressError('Recipient address is required');
	  isValid = false;
	} else if (!isValidAddress(recipientAddress.trim())) {
	  setAddressError('Invalid recipient address');
	  isValid = false;
	}
	
	// Validate amount
	if (!amount || parseFloat(amount) <= 0) {
	  setAmountError('Amount must be greater than 0');
	  isValid = false;
	} else {
	  // Check if amount exceeds balance
	  const parsedAmount = parseAmount(amount, networks[network].decimals);
	  if (BigInt(parsedAmount) > BigInt(balance)) {
		setAmountError('Insufficient balance');
		isValid = false;
	  }
	}
	
	return isValid;
  };
  
  // Handle send transaction
  const handleSendTransaction = async () => {
	try {
	  // Validate form inputs
	  if (!validateForm()) {
		return;
	  }
	  
	  setSending(true);
	  setError(null);
	  
	  // Parse amount
	  const parsedAmount = amount.toString().replace(/,/g, '');
	  
	  // Send transaction
	  const result = await sendTokens(
		wallet,
		recipientAddress.trim(),
		parsedAmount,
		networks[network].nativeDenom,
		memo.trim(),
		network
	  );
	  
	  // Set transaction hash
	  setTxHash(result.transactionHash);
	  
	  // Show success message
	  setSuccess(true);
	  
	  // Reset form
	  setRecipientAddress('');
	  setAmount('');
	  setMemo('');
	  
	  // Update balance after transaction
	  const apiClient = new CreataApiClient(network);
	  const newBalance = await apiClient.getBalance(address);
	  setBalance(newBalance);
	} catch (err) {
	  console.error('Failed to send transaction:', err);
	  setError('Failed to send transaction. Please try again.');
	} finally {
	  setSending(false);
	}
  };
  
  // Render loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading wallet data...</p>
	  </div>
	);
  }
  
  // Render success state
  if (success) {
	return (
	  <div className="success-container" style={{ padding: '24px 16px', textAlign: 'center' }}>
		<div style={{ 
		  width: '64px', 
		  height: '64px', 
		  borderRadius: '50%', 
		  background: 'var(--success-color)',
		  display: 'flex',
		  alignItems: 'center',
		  justifyContent: 'center',
		  margin: '0 auto 16px',
		  color: 'white',
		  fontSize: '32px'
		}}>
		  ✓
		</div>
		
		<h3 style={{ marginBottom: '8px' }}>Transaction Sent!</h3>
		
		<p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>
		  Your transaction has been successfully sent to the network.
		</p>
		
		<div className="tx-hash" style={{ 
		  background: 'var(--background-light)',
		  padding: '12px',
		  borderRadius: '8px',
		  fontSize: '14px',
		  wordBreak: 'break-all',
		  marginBottom: '24px'
		}}>
		  <div style={{ color: 'var(--text-light)', marginBottom: '4px' }}>Transaction Hash:</div>
		  {txHash}
		</div>
		
		<div style={{ display: 'flex', gap: '16px' }}>
		  <button
			className="button button-secondary"
			style={{ flex: 1 }}
			onClick={() => {
			  // View transaction in explorer
			  if (networks[network].explorerUrl) {
				window.open(`${networks[network].explorerUrl}/transactions/${txHash}`, '_blank');
			  }
			}}
		  >
			View Details
		  </button>
		  
		  <button
			className="button button-primary"
			style={{ flex: 1 }}
			onClick={() => {
			  // Reset success state and go back
			  setSuccess(false);
			  onBack();
			}}
		  >
			Done
		  </button>
		</div>
	  </div>
	);
  }
  
  return (
	<div className="send-container">
	  <div className="nav-container">
		<button className="nav-button" onClick={onBack}>
		  Back
		</button>
		<h2 className="nav-title">Send</h2>
		<div></div>
	  </div>
	  
	  <div className="form-container" style={{ padding: '16px' }}>
		<div className="balance-display" style={{ 
		  background: 'var(--background-light)',
		  padding: '12px',
		  borderRadius: '8px',
		  marginBottom: '24px',
		  textAlign: 'center'
		}}>
		  <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>Available Balance:</div>
		  <div style={{ fontSize: '20px', fontWeight: '500' }}>
			{formatAmount(balance, networks[network].decimals)} {networks[network].displayDenom}
		  </div>
		</div>
		
		<div className="form-group">
		  <label className="form-label">Recipient Address</label>
		  <input
			type="text"
			className="form-input"
			value={recipientAddress}
			onChange={handleAddressChange}
			placeholder="creata..."
			style={{
			  border: addressError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			}}
		  />
		  {addressError && <p className="form-error">{addressError}</p>}
		</div>
		
		<div className="form-group">
		  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<label className="form-label">Amount</label>
			<button
			  style={{
				background: 'none',
				border: 'none',
				color: 'var(--primary-color)',
				cursor: 'pointer',
				fontSize: '12px'
			  }}
			  onClick={handleMaxAmount}
			>
			  MAX
			</button>
		  </div>
		  
		  <div style={{ position: 'relative' }}>
			<input
			  type="text"
			  className="form-input"
			  value={amount}
			  onChange={handleAmountChange}
			  placeholder="0.0"
			  style={{
				paddingRight: '60px',
				border: amountError ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
			  }}
			/>
			<span style={{ 
			  position: 'absolute', 
			  right: '12px', 
			  top: '50%', 
			  transform: 'translateY(-50%)',
			  color: 'var(--text-light)'
			}}>
			  {networks[network].displayDenom}
			</span>
		  </div>
		  {amountError && <p className="form-error">{amountError}</p>}
		</div>
		
		<div className="form-group">
		  <label className="form-label">Memo (Optional)</label>
		  <input
			type="text"
			className="form-input"
			value={memo}
			onChange={handleMemoChange}
			placeholder="Add a message (optional)"
		  />
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
		  style={{ width: '100%', marginTop: '24px' }}
		  onClick={handleSendTransaction}
		  disabled={sending || !amount || !recipientAddress}
		>
		  {sending ? (
			<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			  <span className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
			  Sending...
			</span>
		  ) : (
			'Send'
		  )}
		</button>
		
		<div style={{ marginTop: '24px', textAlign: 'center' }}>
		  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
			Please verify all transaction details before sending. Transactions cannot be reversed.
		  </p>
		</div>
	  </div>
	</div>
  );
};

export default Send;