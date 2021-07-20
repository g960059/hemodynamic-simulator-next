const CopyPlugin = require("copy-webpack-plugin");
const withTM = require('next-transpile-modules')(['@mui-treasury/layout']);

module.exports = withTM({
    basePath: '',
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Note: we provide webpack above so you should not `require` it
        // Perform customizations to webpack config
        const destWasm = dev ? "static/chunks/pages" : "static/chunks";
        config.plugins.push(new CopyPlugin({
            patterns: [
                { from: "node_modules/scichart/_wasm/scichart2d.wasm", to: destWasm }
            ]
        }),)

        // Important: return the modified config
        return config
    },
    i18n: {
        locales: ['en', 'ja'],
        defaultLocale: 'en'
    }
  })