// File: src/lib/storage/index.js
// Description: Secure storage module for wallet data

/**
 * Encrypts sensitive data before storing
 * @param {string} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {string} - Encrypted data
 */
const encrypt = async (data, password) => {
  try {
	// Convert string to array buffer
	const textEncoder = new TextEncoder();
	const dataBuffer = textEncoder.encode(data);
	const passwordBuffer = textEncoder.encode(password);
	
	// Create a key from the password
	const keyMaterial = await window.crypto.subtle.importKey(
	  'raw',
	  passwordBuffer,
	  { name: 'PBKDF2' },
	  false,
	  ['deriveKey']
	);
	
	// Generate a random salt
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	
	// Derive an encryption key using PBKDF2
	const key = await window.crypto.subtle.deriveKey(
	  {
		name: 'PBKDF2',
		salt,
		iterations: 100000,
		hash: 'SHA-256'
	  },
	  keyMaterial,
	  { name: 'AES-GCM', length: 256 },
	  false,
	  ['encrypt']
	);
	
	// Generate a random IV
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	
	// Encrypt the data
	const encryptedBuffer = await window.crypto.subtle.encrypt(
	  { name: 'AES-GCM', iv },
	  key,
	  dataBuffer
	);
	
	// Combine the salt, IV, and encrypted data
	const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
	encryptedArray.set(salt, 0);
	encryptedArray.set(iv, salt.length);
	encryptedArray.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
	
	// Convert to base64 string for storage
	return btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
	console.error('Encryption failed:', error);
	throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - Encrypted data in base64
 * @param {string} password - Decryption password
 * @returns {string} - Decrypted data
 */
const decrypt = async (encryptedData, password) => {
  try {
	// Convert base64 string to array buffer
	const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
	
	// Extract salt, IV, and encrypted data
	const salt = encryptedArray.slice(0, 16);
	const iv = encryptedArray.slice(16, 28);
	const encryptedBuffer = encryptedArray.slice(28);
	
	// Convert password to key material
	const textEncoder = new TextEncoder();
	const passwordBuffer = textEncoder.encode(password);
	const keyMaterial = await window.crypto.subtle.importKey(
	  'raw',
	  passwordBuffer,
	  { name: 'PBKDF2' },
	  false,
	  ['deriveKey']
	);
	
	// Derive the key using the same parameters as during encryption
	const key = await window.crypto.subtle.deriveKey(
	  {
		name: 'PBKDF2',
		salt,
		iterations: 100000,
		hash: 'SHA-256'
	  },
	  keyMaterial,
	  { name: 'AES-GCM', length: 256 },
	  false,
	  ['decrypt']
	);
	
	// Decrypt the data
	const decryptedBuffer = await window.crypto.subtle.decrypt(
	  { name: 'AES-GCM', iv },
	  key,
	  encryptedBuffer
	);
	
	// Convert the decrypted data to string
	const textDecoder = new TextDecoder();
	return textDecoder.decode(decryptedBuffer);
  } catch (error) {
	console.error('Decryption failed:', error);
	throw new Error('Failed to decrypt data. Incorrect password or corrupted data.');
  }
};

/**
 * Saves data to Chrome storage
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @param {boolean} secure - Whether to encrypt the data
 * @param {string} password - Encryption password (required if secure=true)
 * @returns {Promise<void>}
 */
const saveData = async (key, value, secure = false, password = null) => {
  try {
	let dataToStore = JSON.stringify(value);
	
	if (secure) {
	  if (!password) {
		throw new Error('Password is required for secure storage');
	  }
	  dataToStore = await encrypt(dataToStore, password);
	}
	
	return new Promise((resolve, reject) => {
	  chrome.storage.local.set({ [key]: dataToStore }, () => {
		if (chrome.runtime.lastError) {
		  reject(chrome.runtime.lastError);
		} else {
		  resolve();
		}
	  });
	});
  } catch (error) {
	console.error('Save data failed:', error);
	throw error;
  }
};

/**
 * Retrieves data from Chrome storage
 * @param {string} key - Storage key
 * @param {boolean} secure - Whether the data is encrypted
 * @param {string} password - Decryption password (required if secure=true)
 * @returns {Promise<any>} - Retrieved data
 */
const getData = async (key, secure = false, password = null) => {
  try {
	return new Promise((resolve, reject) => {
	  chrome.storage.local.get([key], async (result) => {
		if (chrome.runtime.lastError) {
		  reject(chrome.runtime.lastError);
		  return;
		}
		
		const data = result[key];
		if (!data) {
		  resolve(null);
		  return;
		}
		
		if (secure) {
		  if (!password) {
			reject(new Error('Password is required for secure retrieval'));
			return;
		  }
		  
		  try {
			const decryptedData = await decrypt(data, password);
			resolve(JSON.parse(decryptedData));
		  } catch (error) {
			reject(error);
		  }
		} else {
		  resolve(JSON.parse(data));
		}
	  });
	});
  } catch (error) {
	console.error('Get data failed:', error);
	throw error;
  }
};

/**
 * Removes data from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
const removeData = async (key) => {
  return new Promise((resolve, reject) => {
	chrome.storage.local.remove(key, () => {
	  if (chrome.runtime.lastError) {
		reject(chrome.runtime.lastError);
	  } else {
		resolve();
	  }
	});
  });
};

/**
 * Clears all wallet data from storage
 * @returns {Promise<void>}
 */
const clearAllData = async () => {
  return new Promise((resolve, reject) => {
	chrome.storage.local.clear(() => {
	  if (chrome.runtime.lastError) {
		reject(chrome.runtime.lastError);
	  } else {
		resolve();
	  }
	});
  });
};

export {
  saveData,
  getData,
  removeData,
  clearAllData
};