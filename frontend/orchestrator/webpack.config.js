const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
    mode: "development",
    devServer: {
        port: 3000
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html'
        }),
        new ModuleFederationPlugin({
            name: 'orchestrator',
            remotes: {
                dashboard: 'dashboard@http://localhost:3001/remoteEntry.js',
                navbar: 'navbar@http://localhost:3002/remoteEntry.js'
            }
        })
    ]
}