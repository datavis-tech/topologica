import buble from 'rollup-plugin-buble';

export default {
  input: 'topologica.js',
  output: {
    format: 'umd',
    name: 'topologica',
    file: 'dist/topologica.js'
  },
  plugins: [
    buble()
  ]
}
