let helpers = require('./helpers');
let webpack = require('webpack');
let merge = require('webpack-merge');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let GlobalStyle = new ExtractTextPlugin('styles/globalStyle.css');

let clientConfig = {
  target: 'electron-renderer',
  entry: {
    renderer: './renderer/app.ts',
    polyfill: ['reflect-metadata', 'zone.js/dist/zone']
  },
  context: helpers.root('src'),
  output: {
    filename: '[name].bundle.js',
    path: helpers.root('dist', 'renderer'),
    publicPath: "./"
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
    {
      test: /worker\.ts$/i,
      use: ['worker-loader?inline&fallback=false', 'awesome-typescript-loader']
    },
    {
      test: /\.ts$/i,
      exclude: /worker\.ts$/i,
      use: ['awesome-typescript-loader', 'angular2-template-loader']
    },
    {
      test: /global\.scss$/i,
      loader: GlobalStyle.extract(['css-loader?importLoaders=2', 'postcss-loader', 'sass-loader'])
    },
    {
      test: /\.scss$/,
      exclude: /global\.scss$/i,
      use: ['to-string-loader', 'css-loader?importLoaders=2', 'postcss-loader', 'sass-loader']
    },
    {
      test: /\.(gif|png|jpe?g|svg)$/i,
      use: 'file-loader?name=images/[name].[ext]'
    },
    {
      test: /\.(ttf|eot|woff|woff2)$/i,
      use: 'file-loader?name=fonts/[name].[ext]&publicPath=../'
    },
    {
      test: /\.html$/i,
      use: {
        loader: 'html-loader',
        options: {
          attrs: ['object:data', 'img:src']
        }
      }
    },
    {
      test: /\.md$/i,
      use: [
        'raw-loader',
        'nested-require-loader?rawString=true',
        helpers.root('webpack', 'markdown.js')
      ]
    }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      names: ['polyfill']
    }),
    new HtmlWebpackPlugin({
      filename: helpers.root('dist', 'renderer', 'index.html'),
      template: helpers.root('src', 'renderer', 'index.html')
    }),
    new webpack.ContextReplacementPlugin(
        /\@angular(\\|\/)core(\\|\/)esm5/,
        helpers.root('dist')
        ),
    GlobalStyle
  ],
  externals: {
    'leveldown': "require('leveldown')"
  },
};

let developmentConfig = {
  devtool: 'cheap-module-eval-source-map',
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
  bail: process.env.TRAVIS ? JSON.parse(process.env.TRAVIS) : false,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
  ]
};

if (process.env.NODE_ENV === 'production')
module.exports = merge(clientConfig, productionConfig);
else
module.exports = merge(clientConfig, developmentConfig);
