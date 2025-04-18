// File: src/lib/transactions/index.js
// Description: Module for handling Creata blockchain transactions

import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { calculateFee, coins } from '@cosmjs/stargate';
import { networks, parseTokenAmount } from '../../config/network';
import CreataApiClient from '../api';

/**
 * Creates a signing client for Creata blockchain
 * @param {Object} wallet - Wallet object
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Signing client
 */
const createSigningClient = async (wallet, networkId = 'mainnet') => {
  try {
	const network = networks[networkId];
	const gasPrice = GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`);
	
	const client = await SigningStargateClient.connectWithSigner(
	  network.rpcEndpoint,
	  wallet,
	  { gasPrice }
	);
	
	return client;
  } catch (error) {
	console.error('Failed to create signing client:', error);
	throw error;
  }
};

/**
 * Sends tokens
 * @param {Object} wallet - Wallet object
 * @param {string} recipientAddress - Recipient address
 * @param {string} amount - Amount to send
 * @param {string} denom - Token denomination
 * @param {string} memo - Transaction memo
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Transaction result
 */
const sendTokens = async (
  wallet,
  recipientAddress,
  amount,
  denom = 'ucta',
  memo = '',
  networkId = 'mainnet'
) => {
  try {
	const network = networks[networkId];
	const client = await createSigningClient(wallet, networkId);
	const accounts = await wallet.getAccounts();
	const senderAddress = accounts[0].address;
	
	// Parse amount to proper format
	const parsedAmount = parseTokenAmount(amount, network);
	
	// Estimate gas for the transaction
	const gasEstimate = await client.simulate(
	  senderAddress,
	  [{
		typeUrl: "/cosmos.bank.v1beta1.MsgSend",
		value: {
		  fromAddress: senderAddress,
		  toAddress: recipientAddress,
		  amount: coins(parsedAmount, denom)
		}
	  }],
	  memo
	);
	
	// Calculate fee with some buffer
	const fee = calculateFee(
	  Math.floor(gasEstimate * 1.3),
	  GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`)
	);
	
	// Send the transaction
	const result = await client.sendTokens(
	  senderAddress,
	  recipientAddress,
	  coins(parsedAmount, denom),
	  fee,
	  memo
	);
	
	return result;
  } catch (error) {
	console.error('Failed to send tokens:', error);
	throw error;
  }
};

/**
 * Delegates tokens to a validator
 * @param {Object} wallet - Wallet object
 * @param {string} validatorAddress - Validator address
 * @param {string} amount - Amount to delegate
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Transaction result
 */
const delegateTokens = async (
  wallet,
  validatorAddress,
  amount,
  networkId = 'mainnet'
) => {
  try {
	const network = networks[networkId];
	const client = await createSigningClient(wallet, networkId);
	const accounts = await wallet.getAccounts();
	const delegatorAddress = accounts[0].address;
	
	// Parse amount to proper format
	const parsedAmount = parseTokenAmount(amount, network);
	
	const msg = {
	  typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
	  value: {
		delegatorAddress,
		validatorAddress,
		amount: {
		  denom: network.nativeDenom,
		  amount: parsedAmount
		}
	  }
	};
	
	// Estimate gas
	const gasEstimate = await client.simulate(delegatorAddress, [msg], "");
	
	// Calculate fee with buffer
	const fee = calculateFee(
	  Math.floor(gasEstimate * 1.3),
	  GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`)
	);
	
	// Send the transaction
	const result = await client.signAndBroadcast(
	  delegatorAddress,
	  [msg],
	  fee
	);
	
	return result;
  } catch (error) {
	console.error('Failed to delegate tokens:', error);
	throw error;
  }
};

/**
 * Undelegates tokens from a validator
 * @param {Object} wallet - Wallet object
 * @param {string} validatorAddress - Validator address
 * @param {string} amount - Amount to undelegate
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Transaction result
 */
const undelegateTokens = async (
  wallet,
  validatorAddress,
  amount,
  networkId = 'mainnet'
) => {
  try {
	const network = networks[networkId];
	const client = await createSigningClient(wallet, networkId);
	const accounts = await wallet.getAccounts();
	const delegatorAddress = accounts[0].address;
	
	// Parse amount to proper format
	const parsedAmount = parseTokenAmount(amount, network);
	
	const msg = {
	  typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
	  value: {
		delegatorAddress,
		validatorAddress,
		amount: {
		  denom: network.nativeDenom,
		  amount: parsedAmount
		}
	  }
	};
	
	// Estimate gas
	const gasEstimate = await client.simulate(delegatorAddress, [msg], "");
	
	// Calculate fee with buffer
	const fee = calculateFee(
	  Math.floor(gasEstimate * 1.3),
	  GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`)
	);
	
	// Send the transaction
	const result = await client.signAndBroadcast(
	  delegatorAddress,
	  [msg],
	  fee
	);
	
	return result;
  } catch (error) {
	console.error('Failed to undelegate tokens:', error);
	throw error;
  }
};

/**
 * Claims staking rewards
 * @param {Object} wallet - Wallet object
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Transaction result
 */
const claimRewards = async (
  wallet,
  networkId = 'mainnet'
) => {
  try {
	const network = networks[networkId];
	const apiClient = new CreataApiClient(networkId);
	const client = await createSigningClient(wallet, networkId);
	const accounts = await wallet.getAccounts();
	const delegatorAddress = accounts[0].address;
	
	// Get delegations to know which validators to claim from
	const delegations = await apiClient.getDelegations(delegatorAddress);
	
	// Create message for each validator
	const msgs = delegations.map(delegation => ({
	  typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
	  value: {
		delegatorAddress,
		validatorAddress: delegation.delegation.validator_address
	  }
	}));
	
	if (msgs.length === 0) {
	  throw new Error('No delegations found to claim rewards from');
	}
	
	// Estimate gas
	const gasEstimate = await client.simulate(delegatorAddress, msgs, "");
	
	// Calculate fee with buffer
	const fee = calculateFee(
	  Math.floor(gasEstimate * 1.3),
	  GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`)
	);
	
	// Send the transaction
	const result = await client.signAndBroadcast(
	  delegatorAddress,
	  msgs,
	  fee
	);
	
	return result;
  } catch (error) {
	console.error('Failed to claim rewards:', error);
	throw error;
  }
};

/**
 * Redelegate tokens from one validator to another
 * @param {Object} wallet - Wallet object
 * @param {string} srcValidatorAddress - Source validator address
 * @param {string} dstValidatorAddress - Destination validator address
 * @param {string} amount - Amount to redelegate
 * @param {string} networkId - Network ID
 * @returns {Promise<Object>} - Transaction result
 */
const redelegateTokens = async (
  wallet,
  srcValidatorAddress,
  dstValidatorAddress,
  amount,
  networkId = 'mainnet'
) => {
  try {
	const network = networks[networkId];
	const client = await createSigningClient(wallet, networkId);
	const accounts = await wallet.getAccounts();
	const delegatorAddress = accounts[0].address;
	
	// Parse amount to proper format
	const parsedAmount = parseTokenAmount(amount, network);
	
	const msg = {
	  typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
	  value: {
		delegatorAddress,
		validatorSrcAddress: srcValidatorAddress,
		validatorDstAddress: dstValidatorAddress,
		amount: {
		  denom: network.nativeDenom,
		  amount: parsedAmount
		}
	  }
	};
	
	// Estimate gas
	const gasEstimate = await client.simulate(delegatorAddress, [msg], "");
	
	// Calculate fee with buffer
	const fee = calculateFee(
	  Math.floor(gasEstimate * 1.3),
	  GasPrice.fromString(`${network.gasPrice}${network.nativeDenom}`)
	);
	
	// Send the transaction
	const result = await client.signAndBroadcast(
	  delegatorAddress,
	  [msg],
	  fee
	);
	
	return result;
  } catch (error) {
	console.error('Failed to redelegate tokens:', error);
	throw error;
  }
};

export {
  createSigningClient,
  sendTokens,
  delegateTokens,
  undelegateTokens,
  claimRewards,
  redelegateTokens
};