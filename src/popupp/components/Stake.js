// File: src/popup/components/Stake.js
// Description: Component for staking tokens with validators

import React, { useState, useEffect } from 'react';
import { loadWallet, getCurrentAccount } from '../../lib/keyring';
import { delegateTokens, undelegateTokens, claimRewards } from '../../lib/transactions';
import CreataApiClient from '../../lib/api';
import { formatAmount, parseAmount } from '../../utils/helpers';
import { networks } from '../../config/network';

/**
 * Stake component
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Back callback
 * @returns {JSX.Element} - Stake component
 */
const Stake = ({ onBack }) => {
  // Component state
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('validators'); // validators, delegations, rewards
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validators, setValidators] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [totalRewards, setTotalRewards] = useState('0');
  const [network, setNetwork] = useState('mainnet');
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  
  // UI state for delegation modal
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState(null);
  const [delegateAmount, setDelegateAmount] = useState('');
  const [processingTx, setProcessingTx] = useState(false);
  
  // Load data on component mount
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
		
		// Get validators
		const validatorsList = await apiClient.getValidators();
		if (mounted) setValidators(validatorsList);
		
		// Get delegations
		const delegationsList = await apiClient.getDelegations(currentAccount);
		if (mounted) setDelegations(delegationsList);
		
		// Get rewards
		const rewardsData = await apiClient.getRewards(currentAccount);
		if (mounted) {
		  setRewards(rewardsData.rewards || []);
		  
		  // Calculate total rewards
		  let total = '0';
		  if (rewardsData.total && rewardsData.total.length > 0) {
			const nativeReward = rewardsData.total.find(r => r.denom === networks[activeNetwork].nativeDenom);
			if (nativeReward) {
			  total = nativeReward.amount;
			}
		  }
		  setTotalRewards(total);
		}
	  } catch (err) {
		console.error('Failed to load staking data:', err);
		if (mounted) setError('Failed to load staking data. Please try again.');
	  } finally {
		if (mounted) setLoading(false);
	  }
	};
	
	loadData();
	
	return () => {
	  mounted = false;
	};
  }, []);
  
  // Refresh data
  const refreshData = async () => {
	try {
	  setLoading(true);
	  
	  // Create API client
	  const apiClient = new CreataApiClient(network);
	  
	  // Get account balance
	  const balanceAmount = await apiClient.getBalance(address);
	  setBalance(balanceAmount);
	  
	  // Get validators
	  const validatorsList = await apiClient.getValidators();
	  setValidators(validatorsList);
	  
	  // Get delegations
	  const delegationsList = await apiClient.getDelegations(address);
	  setDelegations(delegationsList);
	  
	  // Get rewards
	  const rewardsData = await apiClient.getRewards(address);
	  setRewards(rewardsData.rewards || []);
	  
	  // Calculate total rewards
	  let total = '0';
	  if (rewardsData.total && rewardsData.total.length > 0) {
		const nativeReward = rewardsData.total.find(r => r.denom === networks[network].nativeDenom);
		if (nativeReward) {
		  total = nativeReward.amount;
		}
	  }
	  setTotalRewards(total);
	  
	  setError(null);
	} catch (err) {
	  console.error('Failed to refresh staking data:', err);
	  setError('Failed to refresh staking data. Please try again.');
	} finally {
	  setLoading(false);
	}
  };
  
  // Handle delegate tokens
  const handleDelegate = async () => {
	if (!selectedValidator || !delegateAmount) return;
	
	try {
	  setProcessingTx(true);
	  setError(null);
	  
	  // Delegate tokens
	  await delegateTokens(
		wallet,
		selectedValidator.operator_address,
		delegateAmount,
		network
	  );
	  
	  // Show success message
	  setSuccess(true);
	  setSuccessMessage('Tokens delegated successfully');
	  
	  // Close modal and reset form
	  setDelegateModalOpen(false);
	  setSelectedValidator(null);
	  setDelegateAmount('');
	  
	  // Refresh data after a short delay
	  setTimeout(refreshData, 2000);
	} catch (err) {
	  console.error('Failed to delegate tokens:', err);
	  setError('Failed to delegate tokens. Please try again.');
	} finally {
	  setProcessingTx(false);
	}
  };
  
  // Handle undelegate tokens
  const handleUndelegate = async (delegation) => {
	if (!delegation) return;
	
	try {
	  setProcessingTx(true);
	  setError(null);
	  
	  // Get amount
	  const amount = delegation.balance.amount;
	  
	  // Undelegate tokens
	  await undelegateTokens(
		wallet,
		delegation.delegation.validator_address,
		formatAmount(amount, networks[network].decimals),
		network
	  );
	  
	  // Show success message
	  setSuccess(true);
	  setSuccessMessage('Tokens undelegated successfully. The unbonding period is 21 days.');
	  
	  // Refresh data after a short delay
	  setTimeout(refreshData, 2000);
	} catch (err) {
	  console.error('Failed to undelegate tokens:', err);
	  setError('Failed to undelegate tokens. Please try again.');
	} finally {
	  setProcessingTx(false);
	}
  };
  
  // Handle claim rewards
  const handleClaimRewards = async () => {
	try {
	  setProcessingTx(true);
	  setError(null);
	  
	  // Claim rewards
	  await claimRewards(wallet, network);
	  
	  // Show success message
	  setSuccess(true);
	  setSuccessMessage('Rewards claimed successfully');
	  
	  // Refresh data after a short delay
	  setTimeout(refreshData, 2000);
	} catch (err) {
	  console.error('Failed to claim rewards:', err);
	  setError('Failed to claim rewards. Please try again.');
	} finally {
	  setProcessingTx(false);
	}
  };
  
  // Render loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading staking data...</p>
	  </div>
	);
  }
  
  return (
	<div className="stake-container">
	  <div className="nav-container">
		<button className="nav-button" onClick={onBack}>
		  Back
		</button>
		<h2 className="nav-title">Staking</h2>
		<div></div>
	  </div>
	  
	  <div className="stake-content" style={{ padding: '16px' }}>
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
		
		{success && (
		  <div className="success-message" style={{ 
			background: '#f6ffed', 
			border: '1px solid #b7eb8f',
			borderRadius: '4px',
			padding: '12px',
			marginBottom: '16px',
			color: 'var(--success-color)'
		  }}>
			{successMessage}
		  </div>
		)}
		
		<div className="balance-display" style={{ 
		  background: 'var(--background-light)',
		  padding: '16px',
		  borderRadius: '8px',
		  marginBottom: '24px',
		  textAlign: 'center'
		}}>
		  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
			<div>
			  <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>Available Balance:</div>
			  <div style={{ fontSize: '18px', fontWeight: '500' }}>
				{formatAmount(balance, networks[network].decimals)} {networks[network].displayDenom}
			  </div>
			</div>
			
			<div>
			  <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>Pending Rewards:</div>
			  <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--success-color)' }}>
				{formatAmount(totalRewards, networks[network].decimals)} {networks[network].displayDenom}
			  </div>
			</div>
		  </div>
		  
		  {parseFloat(formatAmount(totalRewards, networks[network].decimals)) > 0 && (
			<button
			  className="button button-primary"
			  style={{ width: '100%', marginTop: '16px' }}
			  onClick={handleClaimRewards}
			  disabled={processingTx}
			>
			  {processingTx ? 'Processing...' : 'Claim All Rewards'}
			</button>
		  )}
		</div>
		
		<div className="tabs" style={{ 
		  display: 'flex', 
		  borderBottom: '1px solid var(--border-color)',
		  marginBottom: '16px'
		}}>
		  <button
			className={`tab-button ${tab === 'validators' ? 'active' : ''}`}
			style={{
			  flex: 1,
			  padding: '12px',
			  background: 'none',
			  border: 'none',
			  borderBottom: tab === 'validators' ? '2px solid var(--primary-color)' : 'none',
			  color: tab === 'validators' ? 'var(--primary-color)' : 'var(--text-color)',
			  fontWeight: tab === 'validators' ? '500' : 'normal',
			  cursor: 'pointer'
			}}
			onClick={() => setTab('validators')}
		  >
			Validators
		  </button>
		  
		  <button
			className={`tab-button ${tab === 'delegations' ? 'active' : ''}`}
			style={{
			  flex: 1,
			  padding: '12px',
			  background: 'none',
			  border: 'none',
			  borderBottom: tab === 'delegations' ? '2px solid var(--primary-color)' : 'none',
			  color: tab === 'delegations' ? 'var(--primary-color)' : 'var(--text-color)',
			  fontWeight: tab === 'delegations' ? '500' : 'normal',
			  cursor: 'pointer'
			}}
			onClick={() => setTab('delegations')}
		  >
			My Delegations
		  </button>
		</div>
		
		{/* Validators Tab */}
		{tab === 'validators' && (
		  <div className="validators-list">
			{validators.length === 0 ? (
			  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)' }}>
				<p>No validators found</p>
			  </div>
			) : (
			  <div>
				{validators.slice(0, 10).map((validator, index) => (
				  <div
					key={index}
					className="validator-item"
					style={{
					  padding: '12px',
					  borderBottom: index < validators.length - 1 ? '1px solid var(--border-color)' : 'none',
					  cursor: 'pointer'
					}}
					onClick={() => {
					  setSelectedValidator(validator);
					  setDelegateModalOpen(true);
					}}
				  >
					<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
					  <div style={{ fontWeight: '500' }}>
						{validator.description?.moniker || 'Validator'}
					  </div>
					  <div style={{ 
						fontSize: '12px',
						background: 'var(--background-light)',
						padding: '2px 6px',
						borderRadius: '4px'
					  }}>
						Commission: {(parseFloat(validator.commission?.commission_rates?.rate || 0) * 100).toFixed(2)}%
					  </div>
					</div>
					
					<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-light)' }}>
					  <div>Voting Power: {formatAmount(validator.tokens, 6, 0)}</div>
					  <div>Status: {validator.status === 'BOND_STATUS_BONDED' ? 'Active' : 'Inactive'}</div>
					</div>
				  </div>
				))}
			  </div>
			)}
		  </div>
		)}
		
		{/* Delegations Tab */}
		{tab === 'delegations' && (
		  <div className="delegations-list">
			{delegations.length === 0 ? (
			  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)' }}>
				<p>No delegations found</p>
				<button
				  className="button button-secondary"
				  style={{ marginTop: '16px' }}
				  onClick={() => setTab('validators')}
				>
				  Stake Now
				</button>
			  </div>
			) : (
			  <div>
				{delegations.map((delegation, index) => {
				  // Find validator info
				  const validator = validators.find(v => v.operator_address === delegation.delegation.validator_address);
				  const validatorName = validator?.description?.moniker || 'Unknown Validator';
				  
				  return (
					<div
					  key={index}
					  className="delegation-item"
					  style={{
						padding: '12px',
						borderBottom: index < delegations.length - 1 ? '1px solid var(--border-color)' : 'none'
					  }}
					>
					  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
						<div style={{ fontWeight: '500' }}>{validatorName}</div>
						<div>
						  {formatAmount(delegation.balance.amount, networks[network].decimals)} {networks[network].displayDenom}
						</div>
					  </div>
					  
					  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
						<button
						  className="button button-secondary"
						  style={{ fontSize: '12px', padding: '4px 8px' }}
						  onClick={() => {
							// Find validator and open delegate modal
							const validator = validators.find(v => v.operator_address === delegation.delegation.validator_address);
							if (validator) {
							  setSelectedValidator(validator);
							  setDelegateModalOpen(true);
							}
						  }}
						>
						  Delegate More
						</button>
						
						<button
						  className="button button-danger"
						  style={{ fontSize: '12px', padding: '4px 8px', marginLeft: '8px' }}
						  onClick={() => handleUndelegate(delegation)}
						  disabled={processingTx}
						>
						  Undelegate
						</button>
					  </div>
					</div>
				  );
				})}
			  </div>
			)}
		  </div>
		)}
	  </div>
	  
	  {/* Delegation Modal */}
	  {delegateModalOpen && selectedValidator && (
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
			<h3 style={{ marginBottom: '16px' }}>Delegate Tokens</h3>
			<p style={{ marginBottom: '16px', fontSize: '14px' }}>
			  Validator: <strong>{selectedValidator.description?.moniker || 'Validator'}</strong>
			</p>
			
			<div className="form-group" style={{ marginBottom: '16px' }}>
			  <label className="form-label">Amount to delegate</label>
			  <div style={{ position: 'relative' }}>
				<input
				  type="text"
				  className="form-input"
				  value={delegateAmount}
				  onChange={(e) => setDelegateAmount(e.target.value)}
				  placeholder="0.0"
				  style={{ paddingRight: '60px' }}
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
			  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
				<div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
				  Available: {formatAmount(balance, networks[network].decimals)}
				</div>
				<button
				  style={{
					background: 'none',
					border: 'none',
					color: 'var(--primary-color)',
					cursor: 'pointer',
					fontSize: '12px'
				  }}
				  onClick={() => {
					// Set max amount (leave some for gas)
					const maxAmount = formatAmount(
					  Math.max(0, Number(balance) - 100000), // Reserve 0.1 CTA for gas
					  networks[network].decimals
					);
					setDelegateAmount(maxAmount);
				  }}
				>
				  MAX
				</button>
			  </div>
			</div>
			
			<div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '24px' }}>
			  <p>Commission: {(parseFloat(selectedValidator.commission?.commission_rates?.rate || 0) * 100).toFixed(2)}%</p>
			  <p style={{ marginTop: '8px' }}>
				Note: The unbonding period for undelegation is 21 days.
			  </p>
			</div>
			
			<div style={{ display: 'flex', gap: '16px' }}>
			  <button
				className="button button-secondary"
				style={{ flex: 1 }}
				onClick={() => {
				  setDelegateModalOpen(false);
				  setSelectedValidator(null);
				  setDelegateAmount('');
				}}
			  >
				Cancel
			  </button>
			  
			  <button
				className="button button-primary"
				style={{ flex: 1 }}
				onClick={handleDelegate}
				disabled={!delegateAmount || processingTx}
			  >
				{processingTx ? 'Processing...' : 'Delegate'}
			  </button>
			</div>
		  </div>
		</div>
	  )}
	</div>
  );
};

export default Stake;