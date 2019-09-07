const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'main.js'
    },
    devServer: {
        hot: false,
        inline: false,
        liveReload: false
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: './index.html',
            filename: 'index.html'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif)$/i,
                loader: 'file-loader',
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".png"]
    },
};
