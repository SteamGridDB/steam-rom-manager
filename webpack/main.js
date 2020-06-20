let helpers = require('./helpers');
let webpack = require('webpack');
let merge = require('webpack-merge');
let path = require('path');

let clientConfig = {
  target: 'electron-main',
  entry: {
    main: './main/app.ts'
  },
  context: helpers.root('src'),
  output: {
    filename: '[name].bundle.js',
    path: helpers.root('dist')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
    {
      test: /\.ts$/i,
      use: ['awesome-typescript-loader'],
    },
    {
      test: /\.js$/i,
      use: {
        loader: 'babel-loader?cacheDirectory=true',
        options: {
          presets: ["@babel/preset-env"],
          plugins: ["@babel/plugin-transform-runtime"],
          sourceType: 'unambiguous'
        }
      }
    }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  }
};

let developmentConfig = {
  devtool: 'source-map',
  performance: {
    hints: false
  },
  output: {
    devtoolModuleFilenameTemplate: function (info) {
      return "file:///" + encodeURI(info.absoluteResourcePath);
    }
  }
};

let productionConfig = {
  bail: process.env.TRAVIS ? JSON.parse(process.env.TRAVIS) : false
};

if (process.env.NODE_ENV === 'production')
module.exports = merge(clientConfig, productionConfig);
else
module.exports = merge(clientConfig, developmentConfig);
