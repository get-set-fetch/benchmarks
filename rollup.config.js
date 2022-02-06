import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  treeshake: 'smallest',
  plugins: [
    nodeResolve({
      resolveOnly: [ /get-set-fetch/ ],
      ignoreSideEffectsForRoot: true,
    }),
    json(),
    commonjs(),
  ],
};
