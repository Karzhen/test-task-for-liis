const path = require('path');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const baseConfig = {
    entry: {
        main: path.resolve(__dirname, './src/index.js'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'index.js',
    },
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: ['html-loader']
            },
            {
                test: /\.(css)$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'weather',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './src/index.html'),
            filename: 'index.html',
        }),
        new CleanWebpackPlugin(),
        // new FaviconsWebpackPlugin({
        //     logo: path.resolve(__dirname, './src/favicon/favicon-32x32.png'),
        //     outputPath: '',
        //     publicPath: '/favicon',
        // }),
        new CopyPlugin({
            patterns: [
                {
                    from: './src/weather/64x64/day',
                    to: 'weather/64x64/day',
                },
                {
                    from: './src/weather/64x64/night',
                    to: 'weather/64x64/night',
                },
            ],
        }),
    ],
}

module.exports = ({ mode }) => {
    const isProductionMode = mode === 'prod';
    const config = isProductionMode ? require('./webpack.prod.config') : require('./webpack.dev.config');

    return merge(baseConfig, config);
};