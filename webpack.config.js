// File: webpack.config.js
// Description: Webpack configuration for building the Creata wallet Chrome extension

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
	popup: path.resolve(__dirname, 'src/popup/index.js'),
	background: path.resolve(__dirname, 'src/background/index.js'),
	contentscript: path.resolve(__dirname, 'src/contentscript/index.js')
  },
  output: {
	path: path.resolve(__dirname, 'dist'),
	filename: '[name].js',
	clean: true
  },
  module: {
	rules: [
	  {
		test: /\.(js|jsx)$/,
		exclude: /node_modules/,
		use: {
		  loader: 'babel-loader',
		  options: {
			presets: ['@babel/preset-env', '@babel/preset-react']
		  }
		}
	  },
	  {
		test: /\.css$/,
		use: ['style-loader', 'css-loader']
	  },
	  {
		test: /\.(png|svg|jpg|jpeg|gif)$/i,
		type: 'asset/resource',
	  }
	]
  },
  plugins: [
	new HtmlWebpackPlugin({
	  template: path.resolve(__dirname, 'public/index.html'),
	  filename: 'index.html',
	  chunks: ['popup']
	}),
	new CopyWebpackPlugin({
	  patterns: [
		{ 
		  from: path.resolve(__dirname, 'public/manifest.json'),
		  to: path.resolve(__dirname, 'dist')
		},
		{ 
		  from: path.resolve(__dirname, 'public/icons'),
		  to: path.resolve(__dirname, 'dist/icons')
		}
	  ]
	})
  ],
  resolve: {
	extensions: ['.js', '.jsx']
  }
};