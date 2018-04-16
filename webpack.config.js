var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var os = require('os');

var host = os.hostname();
var port = '8080';

var is_production = (process.env.NODE_ENV === 'production');

module.exports = {
    mode: is_production ? 'production' : 'development',
    devtool: is_production ? 'source-map' : 'eval-source-map',
    entry: {
        layouteer: [
            path.join(__dirname, 'css', 'layouteer.less'),
            path.join(__dirname, 'src', 'index.js'),
        ]
    },
    output: {
        path: path.join(__dirname, '/dist'),
        publicPath: '/dist/',
        filename: '[name].min.js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            include: path.join(__dirname, 'src'),
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            }
        }, {
            test: /\.less$/,
            include: path.join(__dirname, 'css'),
            use: [
                is_production ? MiniCssExtractPlugin.loader : 'style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: (loader) => [ autoprefixer() ]
                    }
                },
                'less-loader',
            ]
        }]
    },
    plugins: [
        // use extract plugin to build an external file loded by sass-loader > complied to css > movig to bundle.css
        new MiniCssExtractPlugin({
            filename: "[name].min.css",
            chunkFilename: "[id].css"
        }),
        // remove all files from this folder before generating new files
        new CleanWebpackPlugin(['dist'])
    ],
    devServer: {
        host,
        port,
        contentBase: path.join(__dirname)
    }
};
