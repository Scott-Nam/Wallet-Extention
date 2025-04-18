// File: src/popup/components/Dashboard.js
// Description: Dashboard component showing wallet balance and actions

import React, { useState, useEffect } from 'react';
import { loadWallet, getCurrentAccount } from '../../lib/keyring';
import CreataApiClient from '../../lib/api';
import { formatAmount, truncateAddress } from '../../utils/helpers';
import { networks } from '../../config/network';

/**
 * Dashboard component
 * @param {Object} props - Component props
 * @param {Function} props.onSend - Send callback
 * @param {Function} props.onReceive - Receive callback
 * @param {Function} props.onStake - Stake callback
 * @param {Function} props.onSettings - Settings callback
 * @param {Function} props.onLogout - Logout callback
 * @returns {JSX.Element} - Dashboard component
 */
const Dashboard = ({ onSend, onReceive, onStake, onSettings, onLogout }) => {
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  
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
		
		// Get current session password from storage (in a real app, this would be more secure)
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
		
		// Get recent transactions
		const txData = await apiClient.getAccountTransactions(currentAccount, 5);
		if (mounted) setTransactions(txData.txs || []);
	  } catch (err) {
		console.error('Failed to load dashboard data:', err);
		if (mounted) setError('Failed to load wallet data. Please try again.');
	  } finally {
		if (mounted) setLoading(false);
	  }
	};
	
	loadData();
	
	// Set up interval to refresh data
	const refreshInterval = setInterval(() => {
	  refreshData();
	}, 30000); // Refresh every 30 seconds
	
	return () => {
	  mounted = false;
	  clearInterval(refreshInterval);
	};
  }, []);
  
  // Refresh data
  const refreshData = async () => {
	try {
	  setRefreshing(true);
	  
	  // Create API client
	  const apiClient = new CreataApiClient(network);
	  
	  // Get account balance
	  const balanceAmount = await apiClient.getBalance(address);
	  setBalance(balanceAmount);
	  
	  // Get recent transactions
	  const txData = await apiClient.getAccountTransactions(address, 5);
	  setTransactions(txData.txs || []);
	} catch (err) {
	  console.error('Failed to refresh data:', err);
	  // Don't set error on refresh to avoid disrupting UI
	} finally {
	  setRefreshing(false);
	}
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
	refreshData();
  };
  
  // Handle network change
  const handleNetworkChange = async (e) => {
	const newNetwork = e.target.value;
	setNetwork(newNetwork);
	
	// Save to storage
	await chrome.storage.local.set({ creata_active_network: newNetwork });
	
	// Refresh data for new network
	refreshData();
  };
  
  // Format transaction type
  const formatTxType = (tx) => {
	if (!tx.body || !tx.body.messages || tx.body.messages.length === 0) {
	  return 'Transaction';
	}
	
	const msg = tx.body.messages[0];
	const typeUrl = msg['@type'] || msg.type_url;
	
	// Handle common transaction types
	switch (typeUrl) {
	  case '/cosmos.bank.v1beta1.MsgSend':
		return 'Send';
	  case '/cosmos.staking.v1beta1.MsgDelegate':
		return 'Delegate';
	  case '/cosmos.staking.v1beta1.MsgUndelegate':
		return 'Undelegate';
	  case '/cosmos.staking.v1beta1.MsgBeginRedelegate':
		return 'Redelegate';
	  case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward':
		return 'Claim Rewards';
	  case '/ibc.applications.transfer.v1.MsgTransfer':
		return 'IBC Transfer';
	  default:
		return 'Transaction';
	}
  };
  
  // Determine if transaction is outgoing
  const isOutgoingTx = (tx) => {
	if (!tx.body || !tx.body.messages || tx.body.messages.length === 0) {
	  return false;
	}
	
	const msg = tx.body.messages[0];
	const typeUrl = msg['@type'] || msg.type_url;
	
	if (typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
	  return msg.from_address === address || msg.fromAddress === address;
	}
	
	return false;
  };
  
  // Format transaction amount
  const formatTxAmount = (tx) => {
	if (!tx.body || !tx.body.messages || tx.body.messages.length === 0) {
	  return '';
	}
	
	const msg = tx.body.messages[0];
	const typeUrl = msg['@type'] || msg.type_url;
	
	if (typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
	  const amount = msg.amount || msg.amounts;
	  if (amount && Array.isArray(amount) && amount.length > 0) {
		const coin = amount[0];
		if (coin.denom === networks[network].nativeDenom) {
		  return formatAmount(coin.amount, networks[network].decimals);
		}
	  }
	}
	
	return '';
  };
  
  // Render loading state
  if (loading) {
	return (
	  <div className="loading-container">
		<div className="loading-spinner"></div>
		<p>Loading your wallet...</p>
	  </div>
	);
  }
  
  // Render error state
  if (error) {
	return (
	  <div className="error-container">
		<h3>Error</h3>
		<p>{error}</p>
		<button className="button button-primary" onClick={refreshData}>Try Again</button>
	  </div>
	);
  }
  
  return (
	<div className="dashboard-container">
	  <div className="nav-container" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
		<div className="network-selector">
		  <select
			value={network}
			onChange={handleNetworkChange}
			style={{
			  border: 'none',
			  background: 'var(--background-light)',
			  padding: '4px 8px',
			  borderRadius: '4px',
			  fontSize: '12px'
			}}
		  >
			<option value="mainnet">Mainnet</option>
			<option value="testnet">Testnet</option>
		  </select>
		</div>
		<div className="nav-title">Dashboard</div>
		<button
		  className="nav-button"
		  onClick={onSettings}
		  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
		>
		  ⚙️
		</button>
	  </div>
	  
	  <div className="dashboard-content" style={{ padding: '0 16px' }}>
		<div className="address-container" style={{ textAlign: 'center', margin: '8px 0 16px' }}>
		  <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>
			{truncateAddress(address, 10, 6)}
			<button
			  style={{
				background: 'none',
				border: 'none',
				cursor: 'pointer',
				marginLeft: '4px',
				fontSize: '14px'
			  }}
			  onClick={async () => {
				await navigator.clipboard.writeText(address);
				alert('Address copied to clipboard');
			  }}
			>
			  📋
			</button>
		  </p>
		</div>
		
		<div className="balance-container" style={{ textAlign: 'center', padding: '32px 0' }}>
		  <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '8px' }}>Your Balance</p>
		  <h1 className="balance-amount" style={{ fontSize: '36px', fontWeight: '600', margin: '0' }}>
			{formatAmount(balance, networks[network].decimals)}
			<span style={{ fontSize: '20px', marginLeft: '4px' }}>{networks[network].displayDenom}</span>
		  </h1>
		  <button
			style={{
			  background: 'none',
			  border: 'none',
			  color: 'var(--primary-color)',
			  cursor: 'pointer',
			  marginTop: '8px',
			  fontSize: '14px',
			  display: 'inline-flex',
			  alignItems: 'center'
			}}
			onClick={handleRefresh}
		  >
			{refreshing ? (
			  <>
				<span className="loading-spinner" style={{ width: '14px', height: '14px', marginRight: '4px' }}></span>
				Updating...
			  </>
			) : (
			  'Refresh'
			)}
		  </button>
		</div>
		
		<div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-around', margin: '24px 0' }}>
		  <button
			className="action-button"
			onClick={onSend}
			style={{
			  display: 'flex',
			  flexDirection: 'column',
			  alignItems: 'center',
			  background: 'none',
			  border: 'none',
			  cursor: 'pointer',
			  padding: '8px 16px'
			}}
		  >
			<div style={{ 
			  width: '40px', 
			  height: '40px', 
			  borderRadius: '50%', 
			  background: 'var(--primary-color)',
			  display: 'flex',
			  alignItems: 'center',
			  justifyContent: 'center',
			  marginBottom: '8px',
			  color: 'white',
			  fontSize: '18px'
			}}>
			  ↑
			</div>
			<span style={{ fontSize: '14px' }}>Send</span>
		  </button>
		  
		  <button
			className="action-button"
			onClick={onReceive}
			style={{
			  display: 'flex',
			  flexDirection: 'column',
			  alignItems: 'center',
			  background: 'none',
			  border: 'none',
			  cursor: 'pointer',
			  padding: '8px 16px'
			}}
		  >
			<div style={{ 
			  width: '40px', 
			  height: '40px', 
			  borderRadius: '50%', 
			  background: 'var(--success-color)',
			  display: 'flex',
			  alignItems: 'center',
			  justifyContent: 'center',
			  marginBottom: '8px',
			  color: 'white',
			  fontSize: '18px'
			}}>
			  ↓
			</div>
			<span style={{ fontSize: '14px' }}>Receive</span>
		  </button>
		  
		  <button
			className="action-button"
			onClick={onStake}
			style={{
			  display: 'flex',
			  flexDirection: 'column',
			  alignItems: 'center',
			  background: 'none',
			  border: 'none',
			  cursor: 'pointer',
			  padding: '8px 16px'
			}}
		  >
			<div style={{ 
			  width: '40px', 
			  height: '40px', 
			  borderRadius: '50%', 
			  background: 'var(--secondary-color)',
			  display: 'flex',
			  alignItems: 'center',
			  justifyContent: 'center',
			  marginBottom: '8px',
			  color: 'white',
			  fontSize: '18px'
			}}>
			  ⬡
			</div>
			<span style={{ fontSize: '14px' }}>Stake</span>
		  </button>
		</div>
		
		<div className="transactions-container">
		  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
			<h3 style={{ margin: 0 }}>Recent Transactions</h3>
		  </div>
		  
		  {transactions.length === 0 ? (
			<div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)' }}>
			  <p>No transactions yet</p>
			</div>
		  ) : (
			<div className="transaction-list">
			  {transactions.map((tx, index) => (
				<div
				  key={index}
				  className="transaction-item"
				  style={{
					display: 'flex',
					padding: '12px 0',
					borderBottom: index < transactions.length - 1 ? '1px solid var(--border-color)' : 'none'
				  }}
				  onClick={() => {
					if (networks[network].explorerUrl) {
					  window.open(`${networks[network].explorerUrl}/transactions/${tx.txhash}`, '_blank');
					}
				  }}
				>
				  <div
					className="transaction-icon"
					style={{
					  width: '36px',
					  height: '36px',
					  borderRadius: '50%',
					  background: isOutgoingTx(tx) ? 'var(--primary-color)' : 'var(--success-color)',
					  display: 'flex',
					  alignItems: 'center',
					  justifyContent: 'center',
					  marginRight: '12px',
					  color: 'white',
					  fontSize: '16px'
					}}
				  >
					{isOutgoingTx(tx) ? '↑' : '↓'}
				  </div>
				  
				  <div style={{ flex: 1 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					  <div style={{ fontWeight: '500' }}>{formatTxType(tx)}</div>
					  <div style={{ 
						color: isOutgoingTx(tx) ? 'var(--danger-color)' : 'var(--success-color)',
						fontWeight: '500'
					  }}>
						{isOutgoingTx(tx) ? '-' : '+'}{formatTxAmount(tx)} {networks[network].displayDenom}
					  </div>
					</div>
					
					<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
					  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
						{new Date(tx.timestamp).toLocaleString()}
					  </div>
					  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
						{tx.code === 0 ? 'Success' : 'Failed'}
					  </div>
					</div>
				  </div>
				</div>
			  ))}
			</div>
		  )}
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
	</div>
  );
};

export default Dashboard;