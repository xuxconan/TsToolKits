require("@dotenvx/dotenvx").config(); // 加载环境配置文件

const path = require("path");
const webpack = require("webpack");
const WebpackObfuscator = require("webpack-obfuscator"); // 混淆插件
const WebpackParallelUglifyPlugin = require("webpack-parallel-uglify-plugin"); // 压缩插件
const HTMLWebpackPlugin = require("html-webpack-plugin"); // 测试页面插件
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // 清理输出文件插件
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin"); // polyfill兼容性插件

const { SOURCEMAP, MINIMIZED, OBFUSCATE } = process.env || {};

/* #region entry, output, resolve, performance, experiments */
const entry = {
  // Test: "./src/Test", // 测试
  XUXTsToolKits: "./src", // 总入口
  ObjectPool: "./src/ObjectPool", // 对象池
  SandBox: "./src/SandBox", // 沙盒
  SignalSlot: "./src/SignalSlot", // 信号槽
};
const output = {
  path: path.resolve(__dirname, "dist"),
  filename: "[name].min.js",
  sourceMapFilename: "[name].min.map",
  libraryTarget: "umd",
  umdNamedDefine: true,
};
const resolve = {
  alias: { "@": path.resolve(__dirname, "src") },
  extensions: [".tsx", ".ts", ".js"],
  fallback: {
    crypto: "crypto-browserify",
    stream: "stream-browserify",
    buffer: require.resolve("buffer/"),
  },
};
const performance = {
  hints: "warning",
  maxAssetSize: 5 * 1024 * 1024, // 5mb
  maxEntrypointSize: 5 * 1024 * 1024, // 5mb
};
const experiments = {
  // outputModule: true,
};
/* #endregion */

/* #region rules */
const rules = [];

// 加载tsx
const tsxUses = [];
tsxUses.push("ts-loader");
rules.push({
  test: /\.tsx?$/i,
  exclude: /node_modules/,
  use: tsxUses,
});

// 加载js
const jsUses = [];
jsUses.push({
  loader: "babel-loader",
  options: {
    presets: ["@babel/preset-env"],
    plugins: [["@babel/plugin-transform-runtime"]],
  },
});
if (+OBFUSCATE) {
  jsUses.push({
    loader: WebpackObfuscator.loader,
    options: {
      rotateStringArray: true,
    },
  });
}
rules.push({
  test: /\.js?$/i,
  exclude: /node_modules/,
  use: jsUses,
});

// 加载ts
const tsUses = [];
tsUses.push("ts-loader");
rules.push({
  test: /\.ts?$/i,
  exclude: /node-modules/,
  use: tsUses,
});

// 加载图片资源到代码中
rules.push({
  test: /\.(png|jpe?g|svg|gif)$/i,
  include: [],
  exclude: /node_modules/,
  type: "asset/inline",
  parser: {
    dataUrlCondition: {
      maxSize: 1 * 1024 * 1024, // 1mb
    },
  },
});
/* #endregion */

/* #region plugins */
const plugins = [];
plugins.push(
  new webpack.LoaderOptionsPlugin({
    options: {
      productionSourceMap: !!+SOURCEMAP,
    },
  }),
);
plugins.push(
  new HTMLWebpackPlugin({
    title: "Test",
    template: "./public/index.html",
  }),
);
plugins.push(new CleanWebpackPlugin());
plugins.push(new NodePolyfillPlugin());
plugins.push(
  new webpack.ProvidePlugin({
    Buffer: ["Buffer", "Buffer"],
  }),
);
if (+OBFUSCATE) {
  plugins.push(
    new WebpackObfuscator({
      rotateStringArray: true,
    }),
  );
}
/* #endregion */

/* #region optimization */
const minimizer = [];
if (+MINIMIZED) {
  minimizer.push(
    new WebpackParallelUglifyPlugin({
      cacheDir: ".cache/",
      uglifyJS: {
        output: {
          comments: false,
          beautify: false,
        },
        compress: {
          // drop_console: true,
          collapse_vars: true,
          reduce_vars: true,
        },
      },
    }),
  );
}
const optimization = {
  minimize: !!minimizer.length,
  minimizer,
};
/* #endregion */

module.exports = {
  entry,
  output,
  resolve,
  performance,
  experiments,
  module: { rules },
  plugins,
  optimization,
};
