const path = require('path');
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
  entry: './src/index.ts',
  devServer: {
    host: "0.0.0.0",
    port: 8080, //port that we're using for local host (localhost:8080)
    disableHostCheck: true,
    contentBase: path.resolve(appDirectory, "public"), //tells webpack to serve from the public folder
    publicPath: "/",
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(appDirectory, "public/index.html"),
    }),
    new CleanWebpackPlugin(),
  ],
};