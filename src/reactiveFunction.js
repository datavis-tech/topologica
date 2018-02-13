const parse = inputsStr => inputsStr
  .split(',')
  .map(input => input.trim());

export const ReactiveFunction = (fn, inputsStr) => ({
  fn,
  inputs: parse(inputsStr)
})
