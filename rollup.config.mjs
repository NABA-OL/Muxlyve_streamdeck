import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: {
    file: "dist/plugin.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [nodeResolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
};
