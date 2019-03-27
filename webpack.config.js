const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const precss = require('precss');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');



module.exports = (env, argv) => {
    const production = argv.mode === 'production';
    return {
        entry: {
            main: './src/index.js',
            home: './src/home.js'
        },
        devtool: production === false && 'source-map',
        mode: production ? 'production' : 'development',
        output: {
            filename: '[name].bundle.js',
            publicPath: "/bundle/",
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
                        presets: ['es2015', "stage-2"]
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader"
                    ]
                },
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                    },
                },
            ]
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: "[name].bundle.css",
                fallback: 'style-loader',
            })
        ],
        optimization: {
            splitChunks: {
                chunks: 'all',
                name: 'vendor'
            },
            minimize: production,
        },
    };
}
