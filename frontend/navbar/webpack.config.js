const HtmlWebPackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./public/index.html",
  filename: "./index.html"
});
module.exports = {
  mode: 'development',
  devServer: {
    static: path.join(__dirname, "dist"),
    port: 3002,
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader"
      }
    },
    {
      test: /\.(png|jpe?g|gif)$/i,
      use: [
        {
          loader: 'file-loader',
        },
      ],
    }
    ]
  },
  plugins: [
    htmlPlugin,
    new ModuleFederationPlugin({
      name: "navbar",
      filename: "remoteEntry.js",
      exposes: {
        "./AppNavBar": "./src/AppNavBar"
      },
      shared: { react: { singleton: true, eager: true }, "react-dom": { singleton: true, eager: true } },
    })
  ]
};