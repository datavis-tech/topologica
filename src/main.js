import Graph from './graph'
import isReactiveFunction from './isReactiveFunction'
import unpackReactiveFunction from './unpackReactiveFunction'

export default options => {
  const values = new Map();
  const changed = new Set();
  const functions = new Map();
  const graph = Graph();

  const digest = () => {
    graph
      .topologicalSort(Array.from(changed.values()))
      .forEach(property => functions.get(property)());
    changed.clear();
  };

  const setProperty = ([property, value]) => {
    values.set(property, value);
    changed.add(property);
  };

  const set = options => {
    Object.entries(options).forEach(setProperty);
    digest();
  };

  const get = property => values.get(property);

  const getAll = properties => properties.reduce((obj, property) => {
    obj[property] = get(property);
    return obj;
  }, {});

  const allDefined = properties => properties.every(property => values.has(property))

  Object.entries(options).forEach(entry => {
    const [property, value] = entry;
    if (isReactiveFunction(value)) {
      const { fn, inputs } = unpackReactiveFunction(value);

      inputs.forEach(input => {
        graph.addEdge(input, property)
      });

      functions.set(property, () => {
        if (allDefined(inputs)) {
          values.set(property, fn(getAll(inputs)));
        }
      });
    } else {
      functions.set(property, () => get(property));
      setProperty(entry);
    }
  });

  digest();

  return { set, get };
};
