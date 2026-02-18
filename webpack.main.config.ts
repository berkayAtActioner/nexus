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
  // MCP SDK is ESM-only — must be externalized from CJS main bundle
  externals: {
    '@modelcontextprotocol/sdk/client/index.js': 'commonjs2 @modelcontextprotocol/sdk/client/index.js',
    '@modelcontextprotocol/sdk/client/stdio.js': 'commonjs2 @modelcontextprotocol/sdk/client/stdio.js',
  },
  // Keep __dirname and __filename as-is for Electron main/preload
  node: {
    __dirname: false,
    __filename: false,
  },
};
