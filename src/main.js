export default options => {
  const values = {};

  Object.entries(options).forEach(([property, value]) => {
    if (typeof value === 'function') {
      // TODO
    } else {
      values[property] = value;
    }
  });

  return {
    get: property => values[property],
    set: (property, value) => values[property] = value
  };
};
