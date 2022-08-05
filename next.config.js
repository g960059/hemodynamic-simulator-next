const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    basePath: '',
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Note: we provide webpack above so you should not `require` it
        // Perform customizations to webpack config
        config.plugins.push(new CopyPlugin({
            patterns: [
                { from: "node_modules/scichart/_wasm/scichart2d.wasm", to: "static/chunks/pages"  },
                { from: "node_modules/scichart/_wasm/scichart2d.wasm", to: "static/chunks"  },
            ]
        }),)
        config.module.rules.push({
            test: /\.md$/,
            use: "raw-loader",
        });
        if (!isServer) {
            config.resolve.fallback.fs = false;
            config.resolve.fallback.child_process = false;
            config.resolve.fallback.net = false;
            config.resolve.fallback.tls = false;
          }
         // Important: return the modified config
        return config
    },
    images: {
        domains: ['lh3.googleusercontent.com',"firebasestorage.googleapis.com", "127.0.0.1", "localhost"],
    },
    experimental: { esmExternals: true },
  }