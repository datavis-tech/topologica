import pkg from './package.json';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    format: 'umd',
    name: 'Topologica',
    file: pkg.main
  },
  plugins: [
    babel({
      exclude: ['node_modules/**']
    })
  ]
}
