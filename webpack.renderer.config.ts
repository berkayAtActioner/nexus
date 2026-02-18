import type { Configuration } from 'webpack';

import { baseRules } from './webpack.rules';
import { plugins } from './webpack.plugins';

const rendererRules = [
  ...baseRules,
  {
    test: /\.css$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [
              '@tailwindcss/postcss',
            ],
          },
        },
      },
    ],
  },
];

export const rendererConfig: Configuration = {
  module: {
    rules: rendererRules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
