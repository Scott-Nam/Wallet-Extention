// File: src/lib/keyring/index.js
// Description: Keyring module for wallet account management

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import { saveData, getData, removeData } from '../storage';

// Storage keys
const WALLET_KEY = 'creata_wallet';
const ACCOUNTS_KEY = 'creata_accounts';
const CURRENT_ACCOUNT_KEY = 'creata_current_account';

/**
 * Generates a new wallet with mnemonic
 * @param {number} strength - Mnemonic strength (128, 160, 192, 224, 256)
 * @returns {Promise<Object>} - Wallet object
 */
const generateWallet = async (strength = 256) => {
  try {
	const wallet = await DirectSecp256k1HdWallet.generate(
	  24, // 24 words for 256-bit entropy
	  {
		prefix: 'creata', // Address prefix
		hdPaths: [stringToPath("m/44'/60'/0'/0/0")] // Evmos-compatible HD path
	  }
	);
	
	return wallet;
  } catch (error) {
	console.error('Failed to generate wallet:', error);
	throw new Error('Wallet generation failed');
  }
};

/**
 * Imports wallet from mnemonic
 * @param {string} mnemonic - Mnemonic phrase
 * @returns {Promise<Object>} - Wallet object
 */
const importFromMnemonic = async (mnemonic) => {
  try {
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
	  mnemonic,
	  {
		prefix: 'creata', // Address prefix
		hdPaths: [stringToPath("m/44'/60'/0'/0/0")] // Evmos-compatible HD path
	  }
	);
	
	return wallet;
  } catch (error) {
	console.error('Failed to import wallet:', error);
	throw new Error('Invalid mnemonic phrase');
  }
};

/**
 * Imports wallet from private key
 * @param {string} privateKey - Private key in hex format
 * @returns {Promise<Object>} - Wallet object
 */
const importFromPrivateKey = async (privateKey) => {
  try {
	// Implementation depends on the specific format of private keys
	// For Evmos-based chains, this might need adaptation
	throw new Error('Import from private key not implemented yet');
  } catch (error) {
	console.error('Failed to import from private key:', error);
	throw error;
  }
};

/**
 * Stores wallet securely
 * @param {Object} wallet - Wallet object
 * @param {string} password - Encryption password
 * @returns {Promise<void>}
 */
const storeWallet = async (wallet, password) => {
  try {
	const serialized = await wallet.serialize(password);
	await saveData(WALLET_KEY, serialized, true, password);
	
	// Save account information
	const accounts = await wallet.getAccounts();
	const accountsInfo = accounts.map(acc => ({
	  address: acc.address,
	  algo: acc.algo,
	  pubkey: Buffer.from(acc.pubkey).toString('hex')
	}));
	
	await saveData(ACCOUNTS_KEY, accountsInfo, true, password);
	
	// Set current account to the first one
	if (accountsInfo.length > 0) {
	  await saveData(CURRENT_ACCOUNT_KEY, accountsInfo[0].address, true, password);
	}
  } catch (error) {
	console.error('Failed to store wallet:', error);
	throw new Error('Failed to securely store wallet');
  }
};

/**
 * Loads wallet from storage
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} - Wallet object
 */
const loadWallet = async (password) => {
  try {
	const serialized = await getData(WALLET_KEY, true, password);
	if (!serialized) {
	  throw new Error('No wallet found in storage');
	}
	
	const wallet = await DirectSecp256k1HdWallet.deserialize(serialized, password);
	return wallet;
  } catch (error) {
	console.error('Failed to load wallet:', error);
	throw new Error('Failed to load wallet. Incorrect password or corrupted data.');
  }
};

/**
 * Gets all accounts from stored wallet
 * @param {string} password - Decryption password
 * @returns {Promise<Array>} - Array of account objects
 */
const getAccounts = async (password) => {
  try {
	return await getData(ACCOUNTS_KEY, true, password);
  } catch (error) {
	console.error('Failed to get accounts:', error);
	throw error;
  }
};

/**
 * Gets current active account
 * @param {string} password - Decryption password
 * @returns {Promise<string>} - Current account address
 */
const getCurrentAccount = async (password) => {
  try {
	return await getData(CURRENT_ACCOUNT_KEY, true, password);
  } catch (error) {
	console.error('Failed to get current account:', error);
	throw error;
  }
};

/**
 * Sets current active account
 * @param {string} address - Account address
 * @param {string} password - Encryption password
 * @returns {Promise<void>}
 */
const setCurrentAccount = async (address, password) => {
  try {
	await saveData(CURRENT_ACCOUNT_KEY, address, true, password);
  } catch (error) {
	console.error('Failed to set current account:', error);
	throw error;
  }
};

/**
 * Removes wallet from storage
 * @returns {Promise<void>}
 */
const removeWallet = async () => {
  try {
	await removeData(WALLET_KEY);
	await removeData(ACCOUNTS_KEY);
	await removeData(CURRENT_ACCOUNT_KEY);
  } catch (error) {
	console.error('Failed to remove wallet:', error);
	throw error;
  }
};

/**
 * Checks if wallet exists in storage
 * @returns {Promise<boolean>}
 */
const hasWallet = async () => {
  try {
	const serialized = await getData(WALLET_KEY, false);
	return !!serialized;
  } catch (error) {
	return false;
  }
};

export {
  generateWallet,
  importFromMnemonic,
  importFromPrivateKey,
  storeWallet,
  loadWallet,
  getAccounts,
  getCurrentAccount,
  setCurrentAccount,
  removeWallet,
  hasWallet
};