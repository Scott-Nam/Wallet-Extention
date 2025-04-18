#!/bin/bash
# File: setup.sh
# Description: Initial setup script for creata-wallet-extension

# Create project directory
mkdir -p creata-wallet-extension
cd creata-wallet-extension

# Initialize npm project
npm init -y

# Install development dependencies
npm install --save-dev webpack webpack-cli webpack-dev-server copy-webpack-plugin @babel/core @babel/preset-env @babel/preset-react babel-loader css-loader style-loader html-webpack-plugin

# Install main dependencies
npm install react react-dom @emotion/react @emotion/styled bip39 @cosmjs/crypto @cosmjs/encoding @cosmjs/amino @cosmjs/proto-signing @cosmjs/stargate axios

# Create project structure
mkdir -p public
mkdir -p src/background
mkdir -p src/contentscript
mkdir -p src/popup/components
mkdir -p src/popup/pages
mkdir -p src/lib/api
mkdir -p src/lib/keyring
mkdir -p src/lib/storage
mkdir -p src/lib/transactions
mkdir -p src/config
mkdir -p src/utils

# Touch initial files
touch public/index.html
touch public/manifest.json
touch src/background/index.js
touch src/contentscript/index.js
touch src/popup/index.js
touch src/popup/App.js
touch src/lib/api/index.js
touch src/lib/keyring/index.js
touch src/lib/storage/index.js
touch src/lib/transactions/index.js
touch src/config/network.js
touch src/utils/helpers.js
touch webpack.config.js
touch .gitignore

echo "Project structure created successfully!"