const HtmlWebPackPlugin = require("html-webpack-plugin");
const {ModuleFederationPlugin} = require("webpack").container;
const path = require("path");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./public/index.html",
  filename: "./index.html",
  favicon: "./public/rpgLogo.png"
});
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    port: 3004,
    historyApiFallback: {
      disableDotRule: true,
    },
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader"
      }
    }
    ]
  },
  plugins: [
    htmlPlugin,
    new ModuleFederationPlugin({
      name: "Orchestrator",
      filename: "remoteEntry.js",
      remotes: {
        dashboard: "dashboard@http://localhost:3001/remoteEntry.js",
        navbar: "navbar@http://localhost:3002/remoteEntry.js",
        painelControl: "painelControl@http://localhost:3003/remoteEntry.js"
      },
      shared: { react: { singleton: true, eager: true }, "react-dom": { singleton: true, eager: true } },
    })
  ]
};
