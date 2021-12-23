const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    basePath: '',
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Note: we provide webpack above so you should not `require` it
        // Perform customizations to webpack config
        const destWasm = dev ? "static/chunks/pages" : "static/chunks";
        config.plugins.push(new CopyPlugin({
            patterns: [
                { from: "node_modules/scichart/_wasm/scichart2d.wasm", to: "static/chunks/pages"  }
            ]
        }),)
        config.resolve.fallback = {
            ...config.resolve.fallback, 
            fs: false, 
        };   
        config.module.rules.push({
            test: /\.md$/,
            use: "raw-loader",
        })
         // Important: return the modified config
        return config
    },
    i18n: {
        locales: ['en', 'ja'],
        defaultLocale: 'en'
    }
  }