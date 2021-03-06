/*globals module, require */
const webpackNodeExternals = require("webpack-node-externals");
const path = require("path");
const { merge } = require("webpack-merge");
const base = require("../base/webpack.base");

module.exports = merge(base({
    tsConfigFile: 'config/modules/transformer/tsconfig.json'
}), {
    target: "node",
    externals: [
        webpackNodeExternals()
    ],
    entry: {
        index: './src/transformer/index.ts',
    },
    output: {
        path: path.resolve(__dirname, "../../../dist/transformer"),
    }
});
