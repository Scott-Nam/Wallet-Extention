// File: src/background/index.js
// Description: Background script for handling extension events

// Initialize state
let state = {
  isUnlocked: false,
  network: 'mainnet',
  lastActivity: Date.now()
};

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Handle extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
	console.log('Creata Wallet extension installed');
	// Perform first-time setup if needed
  } else if (details.reason === 'update') {
	console.log('Creata Wallet extension updated');
	// Handle extension updates if needed
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Update last activity timestamp
  state.lastActivity = Date.now();
  
  switch (message.type) {
	case 'GET_STATE':
	  // Send current state to popup
	  sendResponse({ success: true, state });
	  break;
	  
	case 'UNLOCK_WALLET':
	  // Authenticate and unlock wallet
	  // In a real implementation, this would verify the password
	  state.isUnlocked = true;
	  sendResponse({ success: true });
	  break;
	  
	case 'LOCK_WALLET':
	  // Lock wallet
	  state.isUnlocked = false;
	  sendResponse({ success: true });
	  break;
	  
	case 'SWITCH_NETWORK':
	  // Switch network
	  if (message.network && (message.network === 'mainnet' || message.network === 'testnet')) {
		state.network = message.network;
		sendResponse({ success: true });
	  } else {
		sendResponse({ success: false, error: 'Invalid network' });
	  }
	  break;
	  
	case 'CONNECT_SITE':
	  // Handle website connection request
	  // This would be expanded in a production implementation
	  sendResponse({ success: true, address: 'creata12345...' });
	  break;
	  
	default:
	  // Unknown message type
	  sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

// Session timeout check
setInterval(() => {
  if (state.isUnlocked && (Date.now() - state.lastActivity > SESSION_TIMEOUT)) {
	console.log('Session timeout, locking wallet');
	state.isUnlocked = false;
  }
}, 60000); // Check every minute

// Listen for connection requests from content scripts
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content-script') {
	port.onMessage.addListener((message) => {
	  // Handle messages from content scripts
	  console.log('Message from content script:', message);
	  
	  // Example response - would be expanded in a real implementation
	  if (message.type === 'REQUEST_ACCOUNTS') {
		if (state.isUnlocked) {
		  port.postMessage({ type: 'ACCOUNTS_RESPONSE', accounts: ['creata12345...'] });
		} else {
		  port.postMessage({ type: 'ERROR', error: 'Wallet is locked' });
		}
	  }
	});
  }
});