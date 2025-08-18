import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const packageJson = require("./package.json");

export default {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
  ],
  external: ["react", "react-dom", "react/jsx-runtime", "@emotion/react"],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
      extensions: ['.js', '.cjs']
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.NPM_PACKAGE_BUILD': JSON.stringify(process.env.NPM_PACKAGE_BUILD || 'false'),
      delimiters: ['', '']
    }),
    typescript({ useTsconfigDeclarationDir: true }),
    image(),
    postcss({
      plugins: [
        postcssImport(),
        tailwindcss(),
        autoprefixer(),
      ],
      extensions: ['.css', '.scss'],
      extract: 'build/bundle.css', // Extract all CSS including modules
      inject: false,
      autoModules: true, // only *.module.(css|scss) treated as modules
      use: ['sass'],
    }),
    json(),
  ],
};
