// File: src/lib/api/index.js
// Description: API client for interacting with the Creata blockchain

import axios from 'axios';
import { networks } from '../../config/network';

/**
 * CreataApiClient class for interacting with Creata blockchain
 */
class CreataApiClient {
  /**
   * Initialize CreataApiClient
   * @param {string} networkId - Network ID (mainnet, testnet)
   */
  constructor(networkId = 'mainnet') {
	this.network = networks[networkId];
	this.restClient = axios.create({
	  baseURL: this.network.restEndpoint,
	  timeout: 30000
	});
	
	this.rpcClient = axios.create({
	  baseURL: this.network.rpcEndpoint,
	  timeout: 30000
	});
  }
  
  /**
   * Get network information
   * @returns {Promise<Object>} - Network status
   */
  async getNodeInfo() {
	try {
	  const response = await this.restClient.get('/node_info');
	  return response.data;
	} catch (error) {
	  console.error('Failed to get node info:', error);
	  throw error;
	}
  }
  
  /**
   * Get chain status
   * @returns {Promise<Object>} - Chain status
   */
  async getStatus() {
	try {
	  const response = await this.rpcClient.get('/status');
	  return response.data.result;
	} catch (error) {
	  console.error('Failed to get status:', error);
	  throw error;
	}
  }
  
  /**
   * Get account information
   * @param {string} address - Account address
   * @returns {Promise<Object>} - Account data
   */
  async getAccount(address) {
	try {
	  const response = await this.restClient.get(`/creata/auth/v1beta1/accounts/${address}`);
	  return response.data.account;
	} catch (error) {
	  if (error.response && error.response.status === 404) {
		// Account not found, likely not initialized yet
		return null;
	  }
	  console.error('Failed to get account:', error);
	  throw error;
	}
  }
  
  /**
   * Get account balances
   * @param {string} address - Account address
   * @returns {Promise<Array>} - Array of balances
   */
  async getBalances(address) {
	try {
	  const response = await this.restClient.get(`/creata/bank/v1beta1/balances/${address}`);
	  return response.data.balances || [];
	} catch (error) {
	  if (error.response && error.response.status === 404) {
		// Account not found or no balances
		return [];
	  }
	  console.error('Failed to get balances:', error);
	  throw error;
	}
  }
  
  /**
   * Get token balance for specific denom
   * @param {string} address - Account address
   * @param {string} denom - Token denomination
   * @returns {Promise<string>} - Balance amount
   */
  async getBalance(address, denom = 'ucta') {
	try {
	  const response = await this.restClient.get(`/creata/bank/v1beta1/balances/${address}/${denom}`);
	  return response.data.balance ? response.data.balance.amount : '0';
	} catch (error) {
	  if (error.response && error.response.status === 404) {
		// Account not found or no balance for denom
		return '0';
	  }
	  console.error('Failed to get balance:', error);
	  throw error;
	}
  }
  
  /**
   * Get transaction details
   * @param {string} hash - Transaction hash
   * @returns {Promise<Object>} - Transaction data
   */
  async getTransaction(hash) {
	try {
	  const response = await this.restClient.get(`/creata/tx/v1beta1/txs/${hash}`);
	  return response.data.tx_response;
	} catch (error) {
	  console.error('Failed to get transaction:', error);
	  throw error;
	}
  }
  
  /**
   * Get account transactions
   * @param {string} address - Account address
   * @param {number} limit - Number of transactions to fetch
   * @param {number} page - Page number
   * @returns {Promise<Object>} - List of transactions
   */
  async getAccountTransactions(address, limit = 10, page = 1) {
	try {
	  // Search for sent transactions
	  const sentQuery = `message.sender='${address}'`;
	  const sentResponse = await this.restClient.get(`/creata/tx/v1beta1/txs?events=${encodeURIComponent(sentQuery)}&pagination.limit=${limit}&pagination.offset=${(page - 1) * limit}`);
	  
	  // Search for received transactions
	  const receivedQuery = `transfer.recipient='${address}'`;
	  const receivedResponse = await this.restClient.get(`/creata/tx/v1beta1/txs?events=${encodeURIComponent(receivedQuery)}&pagination.limit=${limit}&pagination.offset=${(page - 1) * limit}`);
	  
	  // Combine and sort by timestamp
	  const allTxs = [
		...(sentResponse.data.tx_responses || []),
		...(receivedResponse.data.tx_responses || [])
	  ].sort((a, b) => {
		return new Date(b.timestamp) - new Date(a.timestamp);
	  });
	  
	  // Remove duplicates
	  const uniqueTxs = allTxs.filter((tx, index, self) => 
		index === self.findIndex(t => t.txhash === tx.txhash)
	  );
	  
	  return {
		txs: uniqueTxs.slice(0, limit),
		total: uniqueTxs.length
	  };
	} catch (error) {
	  console.error('Failed to get account transactions:', error);
	  throw error;
	}
  }
  
  /**
   * Get chain parameters
   * @returns {Promise<Object>} - Chain parameters
   */
  async getChainParameters() {
	try {
	  const responses = await Promise.all([
		this.restClient.get('/creata/params/v1beta1/params?subspace=staking&key=MaxValidators'),
		this.restClient.get('/creata/params/v1beta1/params?subspace=staking&key=UnbondingTime'),
		this.restClient.get('/creata/params/v1beta1/params?subspace=distribution&key=communitytax'),
		this.restClient.get('/creata/mint/v1beta1/params')
	  ]);
	  
	  return {
		maxValidators: responses[0].data.param?.value,
		unbondingTime: responses[1].data.param?.value,
		communityTax: responses[2].data.param?.value,
		inflation: responses[3].data.params
	  };
	} catch (error) {
	  console.error('Failed to get chain parameters:', error);
	  throw error;
	}
  }
  
  /**
   * Get validators list
   * @param {string} status - Validator status (bonded, unbonded, unbonding)
   * @returns {Promise<Array>} - List of validators
   */
  async getValidators(status = 'BOND_STATUS_BONDED') {
	try {
	  const response = await this.restClient.get(`/creata/staking/v1beta1/validators?status=${status}`);
	  return response.data.validators || [];
	} catch (error) {
	  console.error('Failed to get validators:', error);
	  throw error;
	}
  }
  
  /**
   * Get delegation information for an account
   * @param {string} delegatorAddress - Delegator address
   * @returns {Promise<Array>} - List of delegations
   */
  async getDelegations(delegatorAddress) {
	try {
	  const response = await this.restClient.get(`/creata/staking/v1beta1/delegations/${delegatorAddress}`);
	  return response.data.delegation_responses || [];
	} catch (error) {
	  if (error.response && error.response.status === 404) {
		// No delegations found
		return [];
	  }
	  console.error('Failed to get delegations:', error);
	  throw error;
	}
  }
  
  /**
   * Get reward information for an account
   * @param {string} delegatorAddress - Delegator address
   * @returns {Promise<Object>} - Rewards data
   */
  async getRewards(delegatorAddress) {
	try {
	  const response = await this.restClient.get(`/creata/distribution/v1beta1/delegators/${delegatorAddress}/rewards`);
	  return response.data;
	} catch (error) {
	  if (error.response && error.response.status === 404) {
		// No rewards found
		return { rewards: [], total: [] };
	  }
	  console.error('Failed to get rewards:', error);
	  throw error;
	}
  }
  
  /**
   * Get gas price estimation
   * @returns {Promise<Object>} - Gas price information
   */
  async getGasPrice() {
	try {
	  // This endpoint might not exist on all chains
	  // If not available, return default gas price
	  try {
		const response = await this.restClient.get('/creata/feemarket/v1/base_fee');
		return {
		  low: response.data.base_fee ?? this.network.gasPrice,
		  average: (response.data.base_fee * 1.2) ?? (this.network.gasPrice * 1.2),
		  high: (response.data.base_fee * 1.5) ?? (this.network.gasPrice * 1.5)
		};
	  } catch (e) {
		return {
		  low: this.network.gasPrice,
		  average: this.network.gasPrice * 1.2,
		  high: this.network.gasPrice * 1.5
		};
	  }
	} catch (error) {
	  console.error('Failed to get gas price:', error);
	  throw error;
	}
  }
}

export default CreataApiClient;