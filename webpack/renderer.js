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
        publicPath: "./",
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/i,
                use: ['awesome-typescript-loader', 'angular2-template-loader']
            },
            {
                test: /global\..+\.scss$/i,
                loader: GlobalStyle.extract(['css-loader?importLoaders=2', 'postcss-loader', 'sass-loader'])
            },
            {
                test: /\.scss$/,
                exclude: /global\..+\.scss$/i,
                use: ['to-string-loader', 'css-loader?importLoaders=2', 'postcss-loader', 'sass-loader']
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: 'file-loader?name=images/[name].[ext]&publicPath=../'
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/i,
                use: 'file-loader?name=fonts/[name].[ext]&publicPath=../'
            },
            {
                test: /\.html$/i,
                use: 'html-loader'
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
            /angular(\\|\/)core(\\|\/)@angular/,
            helpers.root('dist')
        ),
        GlobalStyle
    ]
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
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }
        }),
    ]
};

if (process.env.NODE_ENV === 'production')
    module.exports = merge(clientConfig, productionConfig);
else
    module.exports = merge(clientConfig, developmentConfig);