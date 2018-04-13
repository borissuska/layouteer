var path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: [
        path.join(__dirname, 'src', 'index.js'),
    ],
    output: {
        path: path.join(__dirname, '/dist'),
        publicPath: '/dist/',
        filename: 'layouteer.min.js'
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
            use: "style-loader!css-loader!autoprefixer-loader!less-loader"
        }]
    },
    devServer: {
        contentBase: path.join(__dirname)
    }
};
