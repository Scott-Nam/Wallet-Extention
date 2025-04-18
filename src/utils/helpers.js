// File: src/utils/helpers.js
// Description: Utility helper functions for the Creata wallet extension

/**
 * Formats an amount with the given decimal places
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Number of decimal places
 * @param {number} displayDecimals - Number of decimals to display
 * @returns {string} - Formatted amount
 */
export const formatAmount = (amount, decimals = 18, displayDecimals = 6) => {
  if (!amount) return '0';
  
  // Convert to number and divide by 10^decimals
  const value = Number(amount) / Math.pow(10, decimals);
  
  // Format with commas and specified decimal places
  return value.toLocaleString('en-US', {
	minimumFractionDigits: 0,
	maximumFractionDigits: displayDecimals
  });
};

/**
 * Parses a display amount to chain format
 * @param {string|number} amount - Amount to parse
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Parsed amount
 */
export const parseAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  
  // Remove commas and convert to float
  const value = parseFloat(amount.toString().replace(/,/g, ''));
  
  // Multiply by 10^decimals and return as string
  return (value * Math.pow(10, decimals)).toString();
};

/**
 * Truncates an address for display
 * @param {string} address - Address to truncate
 * @param {number} startChars - Number of characters to show at the start
 * @param {number} endChars - Number of characters to show at the end
 * @returns {string} - Truncated address
 */
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Validates an address format
 * @param {string} address - Address to validate
 * @returns {boolean} - Whether the address is valid
 */
export const isValidAddress = (address) => {
  if (!address) return false;
  
  // Basic validation for Creata addresses
  // This should be replaced with chain-specific validation logic
  return address.startsWith('creata') && address.length === 44;
};

/**
 * Formats a date for display
 * @param {string|number|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleString('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
  });
};

/**
 * Formats a transaction type for display
 * @param {string} type - Transaction type
 * @returns {string} - Formatted transaction type
 */
export const formatTransactionType = (type) => {
  if (!type) return 'Transaction';
  
  // Handle common transaction types
  const typeMap = {
	'/cosmos.bank.v1beta1.MsgSend': 'Send',
	'/cosmos.staking.v1beta1.MsgDelegate': 'Delegate',
	'/cosmos.staking.v1beta1.MsgUndelegate': 'Undelegate',
	'/cosmos.staking.v1beta1.MsgBeginRedelegate': 'Redelegate',
	'/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': 'Claim Rewards',
	'/ibc.applications.transfer.v1.MsgTransfer': 'IBC Transfer'
  };
  
  return typeMap[type] || 'Transaction';
};

/**
 * Generates a random color based on an input string
 * @param {string} input - Input string
 * @returns {string} - Hex color code
 */
export const generateColorFromString = (input) => {
  if (!input) return '#000000';
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
	hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
	const value = (hash >> (i * 8)) & 0xFF;
	color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

/**
 * Validates a mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} - Whether the mnemonic is valid
 */
export const isValidMnemonic = (mnemonic) => {
  if (!mnemonic) return false;
  
  // Basic validation for BIP39 mnemonics
  const words = mnemonic.trim().split(/\s+/);
  return [12, 15, 18, 21, 24].includes(words.length);
};

/**
 * Calculates estimated transaction fee
 * @param {number} gasLimit - Gas limit
 * @param {number} gasPrice - Gas price
 * @returns {string} - Estimated fee
 */
export const calculateFee = (gasLimit, gasPrice) => {
  if (!gasLimit || !gasPrice) return '0';
  
  return (gasLimit * gasPrice).toString();
};

/**
 * Creates a retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Function} - Retry function
 */
export const withRetry = (fn, maxRetries = 3, baseDelay = 1000) => {
  return async (...args) => {
	let lastError;
	
	for (let attempt = 0; attempt < maxRetries; attempt++) {
	  try {
		return await fn(...args);
	  } catch (error) {
		lastError = error;
		
		// Calculate delay with exponential backoff
		const delay = baseDelay * Math.pow(2, attempt);
		
		// Wait before next retry
		await new Promise(resolve => setTimeout(resolve, delay));
	  }
	}
	
	throw lastError;
  };
};

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether the copy was successful
 */
export const copyToClipboard = async (text) => {
  try {
	await navigator.clipboard.writeText(text);
	return true;
  } catch (error) {
	console.error('Failed to copy text:', error);
	return false;
  }
};