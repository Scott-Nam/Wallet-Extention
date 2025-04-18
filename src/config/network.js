// File: src/config/network.js
// Description: Network configuration for connecting to Creata blockchain

const networks = {
  mainnet: {
	chainId: 'creata_11111-1', // Replace with actual chain ID
	chainName: 'Creata',
	rpcEndpoint: 'http://10.0.0.239:26657',
	restEndpoint: 'http://10.0.0.239:1317',
	websocketEndpoint: 'ws://10.0.0.239:26657/websocket',
	grpcEndpoint: '10.0.0.239:9090',
	nativeDenom: 'ucta',
	displayDenom: 'CTA',
	decimals: 18,
	coinGeckoId: 'creata', // Replace with actual CoinGecko ID if available
	gasPrice: 0.025, // Default gas price
	explorerUrl: 'http://10.0.0.242', // Explorer URL
	features: ['staking', 'ibc-transfer']
  },
  testnet: {
	chainId: 'creata-testnet', // Replace with actual testnet chain ID
	chainName: 'Creata Testnet',
	rpcEndpoint: 'http://10.0.0.239:26657',
	restEndpoint: 'http://10.0.0.239:1317',
	websocketEndpoint: 'ws://10.0.0.239:26657/websocket',
	grpcEndpoint: '10.0.0.239:9090',
	nativeDenom: 'ucta',
	displayDenom: 'CTA',
	decimals: 18,
	gasPrice: 0.025,
	explorerUrl: 'http://10.0.0.242',
	features: ['staking', 'ibc-transfer']
  }
};

// Helper functions for network operations
const getNetworkByChainId = (chainId) => {
  return Object.values(networks).find(network => network.chainId === chainId);
};

const formatTokenAmount = (amount, network) => {
  if (!amount) return '0';
  
  const value = Number(amount) / Math.pow(10, network.decimals);
  return value.toLocaleString('en-US', {
	maximumFractionDigits: 6
  });
};

const parseTokenAmount = (amount, network) => {
  if (!amount) return '0';
  
  const value = parseFloat(amount) * Math.pow(10, network.decimals);
  return value.toString();
};

export {
  networks,
  getNetworkByChainId,
  formatTokenAmount,
  parseTokenAmount
};