const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const Projects = ["NickiAdmin"];

/**
 * @param {{ development: boolean }} env
 */
module.exports = ({ development }) => ({
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
        enforce: "pre",
        test: /\.html$/,
        loader: "html-loader",
      },
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
    new Dotenv({
      path: `.env.${development ? "development" : "production"}`,
      allowEmptyValues: false,
      safe: true,
      silent: false,
      systemvars: true,
    }),
    new Dotenv({
      path: `.env`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: `*/.clasp.json`,
          context: "src/",
          transform: {
            transformer: (content) =>
              content
                .toString()
                .replace(
                  "SCRIPT_ID",
                  process.env.CLASP_SCRIPT_ID ||
                    "1972_r7VW7xV1mkfWQh3GbTGjsgaduvzKOl0Z3-u4gkoWlHtQHGifhyj-",
                ),
          },
        },
        { from: `*/appsscript.json`, context: "src/" },
        { from: `*/entry.js`, context: "src/" },
        //{ from: `*/*.html`, context: "src/" },
      ],
    }),
  ],
});
