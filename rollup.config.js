import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/plugin.ts",
  output: {
    file: "com.naba.muxlyve.streamdeck.sdPlugin/bin/plugin.js",
    format: "cjs",
    sourcemap: false,
  },
  plugins: [
    typescript({ tsconfig: "./tsconfig.json" }),
    nodeResolve({ preferBuiltins: false, exportConditions: ["node"] }),
    commonjs(),
    json(),
  ],
  external: ["streamdeck", "fs", "path", "os"],
};
