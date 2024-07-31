const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    basePath: '',
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Note: we provide webpack above so you should not `require` it
        // Perform customizations to webpack config
        const TerserPlugin = require('terser-webpack-plugin');
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
         return {
            ...config,
            optimization: {
              ...config.optimization,
              // Using TerserPlugin created by Next.js breaks the editor, so we create a custom one.
              // About the error: https://github.com/TypeCellOS/BlockNote/issues/292
              // TerserPlugin Option reference: https://github.com/vercel/next.js/blob/5f9d2c55ca3ca3bd6a01cf60ced69d3dd2c64bf4/packages/next/src/build/webpack-config.ts#L1151
              minimizer: [
                new TerserPlugin({
                  terserOptions: {
                    parse: {
                      ecma: 8,
                    },
                    compress: {
                      ecma: 5,
                      warnings: false,
                      comparisons: false,
                      inline: 2,
                    },
                    output: {
                      ecma: 5,
                      safari10: true,
                      comments: false,
                      ascii_only: true,
                    },
                    mangle: {
                      safari10: true,
                    },
                  },
                }),
                config.optimization.minimizer[1],
              ],
            },
        }
    },
    images: {
        domains: ['circleheart.dev','www.circleheart.dev','lh3.googleusercontent.com',"firebasestorage.googleapis.com", "127.0.0.1", "localhost"],
    },    
    experimental: { esmExternals: true, appDir: true },
  }