const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const Projects = ["NickiAdmin", "NickiOrderForm"];

module.exports = {
  entry: Projects.reduce(
    (entries, projectName) => ({
      ...entries,
      [projectName]: `./src/${projectName}/index.ts`,
    }),
    {},
  ),
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    clean: true,
    filename: "[name]/[name].js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "Nicki",
      type: "var",
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new Dotenv(),
    new CopyPlugin({
      patterns: [
        { from: `*/.clasp.json`, context: "src/" },
        { from: `*/appsscript.json`, context: "src/" },
        { from: `*/entry.js`, context: "src/" },
        //{ from: `*/*.html`, context: "src/" },
      ],
    }),
  ],
};
