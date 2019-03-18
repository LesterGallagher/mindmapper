const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const precss = require('precss');

/*
 * We've enabled ExtractTextPlugin for you. This allows your app to
 * use css modules that will be moved into a separate CSS file instead of inside
 * one of your module entries!
 *
 * https://github.com/webpack-contrib/extract-text-webpack-plugin
 *
 */

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        main: './src/index.js',
        home: './src/home.js'
    },
    devtool: 'source-map',
    mode: 'development',
    output: {
        filename: '[name].bundle.js',
        publicPath: "bundle/",
        path: path.resolve(__dirname, 'bundle')
    },

    devServer: {
        inline: true,
        port: 8080
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',

                options: {
                    presets: ['es2015',  "stage-2"]
                }
            },
            {
                test: /\.css$/,

                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                url: false,
                                sourceMap: true,
                                importLoaders: 1
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: function () {
                                    return [precss, autoprefixer];
                                }
                            }
                        }
                    ],
                    fallback: 'style-loader'
                })
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin('style.bundle.css')
    ],
};
