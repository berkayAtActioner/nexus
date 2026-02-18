import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  // Externalize native modules + ESM-only packages from CJS main bundle
  externals: {
    '@modelcontextprotocol/sdk/client/index.js': 'commonjs2 @modelcontextprotocol/sdk/client/index.js',
    '@modelcontextprotocol/sdk/client/stdio.js': 'commonjs2 @modelcontextprotocol/sdk/client/stdio.js',
    '@modelcontextprotocol/sdk/client/streamableHttp.js': 'commonjs2 @modelcontextprotocol/sdk/client/streamableHttp.js',
    '@modelcontextprotocol/sdk/client/sse.js': 'commonjs2 @modelcontextprotocol/sdk/client/sse.js',
    '@modelcontextprotocol/sdk/client/auth-extensions.js': 'commonjs2 @modelcontextprotocol/sdk/client/auth-extensions.js',
    'express': 'commonjs2 express',
    'cors': 'commonjs2 cors',
    'passport': 'commonjs2 passport',
    'passport-google-oauth20': 'commonjs2 passport-google-oauth20',
    'passport-github2': 'commonjs2 passport-github2',
    'jsonwebtoken': 'commonjs2 jsonwebtoken',
    'stream-chat': 'commonjs2 stream-chat',
    'better-sqlite3': 'commonjs2 better-sqlite3',
  },
  // Keep __dirname and __filename as-is for Electron main/preload
  node: {
    __dirname: false,
    __filename: false,
  },
};
