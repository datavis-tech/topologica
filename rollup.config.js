import pkg from './package.json';
import buble from 'rollup-plugin-buble';

export default {
  input: 'src/index.js',
  output: {
    format: 'umd',
    name: 'Topologica',
    file: pkg.main
  },
  plugins: [
    buble()
  ]
}
