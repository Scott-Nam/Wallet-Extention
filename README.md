# Creata Wallet Chrome Extension
A Chrome extension wallet for the Creata blockchain ecosystem, built on Evmos technology.

## Features
- Create or import wallet with mnemonic phrase
- View wallet balance and transaction history
- Send and receive CTA tokens
- Stake tokens with validators
- Manage multiple accounts
- Connect to dApps securely
- Support for Mainnet and Testnet

## Development Setup

### Prerequisites
- Ubuntu 22.04
- Node.js (v16+)
- npm (v8+)
- Chrome browser

### Installation
1. Clone this repository:
git clone <repository-url>
cd creata-wallet-extension

2. Install dependencies:
npm install

3. Create a build:
npm run build

### Local Development
1. Run the development server:
npm run dev

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` directory

## Project Structure
creata-wallet-extension

├── public/                  # Static assets
│ 
├── src/
│ 
│   ├── background/          # Background scripts
│ 
│   ├── contentscript/       # Content scripts
│ 
│   ├── popup/               # Popup UI
│ 
│   │   ├── components/      # React components
│ 
│   │   ├── App.js           # Main App component
│ 
│   │   └── index.js         # Entry point
│ 
│   ├── lib/                 # Shared libraries
│ 
│   │   ├── api/             # Blockchain API integration
│ 
│   │   ├── keyring/         # Key management
│ 
│   │   ├── storage/         # Secure storage
│ 
│   │   └── transactions/    # Transaction handling
│ 
│   ├── config/              # Configuration files
│ 
│   └── utils/               # Utility functions
│ 
├── manifest.json            # Extension manifest
│ 
└── package.json             # Dependencies


## Network Configuration
The extension connects to the following Creata blockchain services:

- RPC: http://10.0.0.239:26657
- REST API: http://10.0.0.239:1317
- WebSocket: ws://10.0.0.239:26657/websocket
- gRPC (optional): 10.0.0.239:9090

## Building for Production
To create a production build:
npm run build:prod

The output will be in the `dist` directory, ready to be packaged and deployed to the Chrome Web Store.

## Security Considerations
- All sensitive data (private keys, mnemonics) are encrypted in storage
- Session timeout for automatic locking
- Permission model for dApp connections
- No external dependencies for cryptographic operations

## License

[MIT License](LICENSE)
