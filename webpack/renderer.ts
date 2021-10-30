import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';

import * as helpers from './helpers';

let clientConfig: Configuration = {
  target: 'electron-renderer',
  entry: {
    renderer: './renderer/app.ts'
  },
  context: helpers.root('src'),
  output: {
    filename: '[name].bundle.js',
    path: helpers.root('dist', 'renderer'),
    publicPath: './'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ['ts-loader', 'angular2-template-loader']
      },
      {
        test: /global\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.scss$/i,
        use: [
          'to-string-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ],
        exclude: /global\.scss$/,
        type: 'asset/inline'
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.html$/i,
        use: ['to-string-loader', 'html-loader']
      },
      {
        test: /\.md$/i,
        use: [helpers.root('webpack', 'markdown.js')],
        type: 'asset/source'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      filename: helpers.root('dist', 'renderer', 'index.html'),
      template: helpers.root('src', 'renderer', 'index.html')
    })
  ],
  node: false,
  externals: {
    leveldown: "require('leveldown')"
  }
};

let developmentConfig: Configuration = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  performance: {
    hints: false
  },
  output: {
    devtoolModuleFilenameTemplate: function (info: any) {
      return 'file:///' + encodeURI(info.absoluteResourcePath);
    }
  }
};

let productionConfig: Configuration = {
  mode: 'production',
  bail: process.env.TRAVIS ? JSON.parse(process.env.TRAVIS) : false
};

if (process.env.NODE_ENV === 'production')
  module.exports = merge(clientConfig, productionConfig);
else module.exports = merge(clientConfig, developmentConfig);

// let helpers = require('./helpers');
// let webpack = require('webpack');
// let merge = require('webpack-merge');
// let HtmlWebpackPlugin = require('html-webpack-plugin');
// let ExtractTextPlugin = require("extract-text-webpack-plugin");
// let GlobalStyle = new ExtractTextPlugin('styles/globalStyle.css');

// let clientConfig = {
//   module: {
//     rules: [
//     {
//       test: /worker\.ts$/i,
//       use: ['worker-loader?inline&fallback=false', 'awesome-typescript-loader']
//     },
//     {
//       test: /\.ts$/i,
//       exclude: /worker\.ts$/i,
//       use: ['awesome-typescript-loader', 'angular2-template-loader']
//     },
//     {
//       test: /global\.scss$/i,
//       loader: GlobalStyle.extract(['css-loader?importLoaders=2', 'postcss-loader', 'sass-loader'])
//     },
//     {
//       test: /\.scss$/,
//       exclude: /global\.scss$/i,
//       use: ['to-string-loader', 'css-loader?importLoaders=2', 'postcss-loader', 'sass-loader']
//     },
//     {
//       test: /\.(gif|png|jpe?g|svg)$/i,
//       use: 'file-loader?name=images/[name].[ext]'
//     },
//     {
//       test: /\.(ttf|eot|woff|woff2)$/i,
//       use: 'file-loader?name=fonts/[name].[ext]&publicPath=../'
//     },
//     {
//       test: /\.html$/i,
//       use: {
//         loader: 'html-loader',
//         options: {
//           attrs: ['object:data', 'img:src']
//         }
//       }
//     },
//     {
//       test: /\.md$/i,
//       use: [
//         'raw-loader',
//         'nested-require-loader?rawString=true',
//         helpers.root('webpack', 'markdown.js')
//       ]
//     }
//     ]
//   },
//   plugins: [
//     new webpack.optimize.CommonsChunkPlugin({
//       names: ['polyfill']
//     }),
//     new webpack.ContextReplacementPlugin(
//         /\@angular(\\|\/)core(\\|\/)esm5/,
//         helpers.root('dist')
//         ),
//     GlobalStyle
//   ],

// };
