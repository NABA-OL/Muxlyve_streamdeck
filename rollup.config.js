import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
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
    nodeResolve({ preferBuiltins: true }),
    json(),
  ],
  external: ["streamdeck", "ws", "fs", "path", "os"],
};
