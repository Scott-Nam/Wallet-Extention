// File: src/contentscript/index.js
// Description: Content script for interacting with web pages

// Inject provider into the page
injectProvider();

// Create a connection to the background script
const port = chrome.runtime.connect({ name: 'content-script' });

// Listen for messages from the background script
port.onMessage.addListener((message) => {
  // Forward messages to the page
  window.postMessage({
	type: 'CREATA_WALLET_RESPONSE',
	message
  }, '*');
});

// Listen for messages from the page
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  
  const { data } = event;
  
  // Check if the message is for our extension
  if (data.type === 'CREATA_WALLET_REQUEST') {
	// Forward the message to the background script
	port.postMessage(data.message);
  }
});

/**
 * Injects the Creata provider into the page
 */
function injectProvider() {
  try {
	// Create a script element
	const script = document.createElement('script');
	script.textContent = `
	  // Creata Wallet Provider
	  window.creataWallet = {
		// Check if the extension is installed
		isInstalled: true,
		
		// Request accounts
		requestAccounts: function() {
		  return new Promise((resolve, reject) => {
			const requestId = Date.now().toString();
			
			// Send request to content script
			window.postMessage({
			  type: 'CREATA_WALLET_REQUEST',
			  message: {
				type: 'REQUEST_ACCOUNTS',
				requestId
			  }
			}, '*');
			
			// Listen for response
			function handleResponse(event) {
			  const { data } = event;
			  if (data.type === 'CREATA_WALLET_RESPONSE' && 
				  data.message.requestId === requestId) {
				  
				// Remove event listener
				window.removeEventListener('message', handleResponse);
				
				if (data.message.error) {
				  reject(new Error(data.message.error));
				} else {
				  resolve(data.message.accounts);
				}
			  }
			}
			
			window.addEventListener('message', handleResponse);
			
			// Set timeout for request
			setTimeout(() => {
			  window.removeEventListener('message', handleResponse);
			  reject(new Error('Request timeout'));
			}, 30000);
		  });
		},
		
		// Send transaction
		sendTransaction: function(txParams) {
		  return new Promise((resolve, reject) => {
			const requestId = Date.now().toString();
			
			// Send request to content script
			window.postMessage({
			  type: 'CREATA_WALLET_REQUEST',
			  message: {
				type: 'SEND_TRANSACTION',
				requestId,
				txParams
			  }
			}, '*');
			
			// Listen for response
			function handleResponse(event) {
			  const { data } = event;
			  if (data.type === 'CREATA_WALLET_RESPONSE' && 
				  data.message.requestId === requestId) {
				  
				// Remove event listener
				window.removeEventListener('message', handleResponse);
				
				if (data.message.error) {
				  reject(new Error(data.message.error));
				} else {
				  resolve(data.message.txHash);
				}
			  }
			}
			
			window.addEventListener('message', handleResponse);
			
			// Set timeout for request
			setTimeout(() => {
			  window.removeEventListener('message', handleResponse);
			  reject(new Error('Request timeout'));
			}, 60000);
		  });
		},
		
		// Sign message
		signMessage: function(message) {
		  return new Promise((resolve, reject) => {
			const requestId = Date.now().toString();
			
			// Send request to content script
			window.postMessage({
			  type: 'CREATA_WALLET_REQUEST',
			  message: {
				type: 'SIGN_MESSAGE',
				requestId,
				message
			  }
			}, '*');
			
			// Listen for response
			function handleResponse(event) {
			  const { data } = event;
			  if (data.type === 'CREATA_WALLET_RESPONSE' && 
				  data.message.requestId === requestId) {
				  
				// Remove event listener
				window.removeEventListener('message', handleResponse);
				
				if (data.message.error) {
				  reject(new Error(data.message.error));
				} else {
				  resolve(data.message.signature);
				}
			  }
			}
			
			window.addEventListener('message', handleResponse);
			
			// Set timeout for request
			setTimeout(() => {
			  window.removeEventListener('message', handleResponse);
			  reject(new Error('Request timeout'));
			}, 30000);
		  });
		}
	  };
	  
	  // Dispatch event to notify dApps that provider is ready
	  window.dispatchEvent(new Event('creataWalletReady'));
	`;
	
	// Append the script to the document
	document.head.appendChild(script);
	
	// Remove the script element (not needed anymore)
	script.remove();
	
	console.log('Creata Wallet provider injected');
  } catch (error) {
	console.error('Failed to inject Creata Wallet provider:', error);
  }
}