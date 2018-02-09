export default value => (
  Array.isArray(value)
  && value.length === 2
  && typeof value[0] === 'function'
  && typeof value[1] === 'string'
)
