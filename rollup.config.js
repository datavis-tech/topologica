import pkg from './package.json';

export default {
  input: 'src/main.js',
  output: {
    format: 'umd',
    name: 'topologica',
    file: pkg.main
  },
}
