const parse = inputsStr => inputsStr
  .split(',')
  .map(input => input.trim());

export default ([fn, inputsStr]) => ({
  fn,
  inputs: parse(inputsStr)
})
