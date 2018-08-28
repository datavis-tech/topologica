import Graph from './graph'

const isAsync = fn => fn.constructor.name === 'AsyncFunction';

const Topologica = options => {
  const values = new Map();
  const changed = new Set();
  const functions = new Map();
  const graph = Graph();

  const digest = () => {
    graph
      .topologicalSort(Array.from(changed.values()))
      .forEach(property => {
        functions.get(property)();
      });
    changed.clear();
  };

  const setProperty = ([property, value]) => {
    if (values.get(property) !== value) {
      values.set(property, value);
      changed.add(property);
    }
  };

  const set = options => {
    Object.entries(options).forEach(setProperty);
    digest();
  };

  const get = values.get.bind(values);

  const getAll = properties =>
    properties.reduce((accumulator, property) => {
      accumulator[property] = get(property);
      return accumulator;
    }, {});

  const allDefined = properties => properties
    .every(values.has, values);

  if (options) {
    Object.entries(options).forEach(([ property, fn ]) => {
      const { dependencies } = fn;

      const propertySync = isAsync(fn) ? property + "'" : property;

      dependencies.forEach(input => {
        graph.addEdge(input, propertySync);
      });

      functions.set(propertySync, () => {
        if (allDefined(dependencies)) {
          const output = fn(getAll(dependencies));
          isAsync(fn)
            ? output.then(value => {
              set({[property]: value});
            })
            : values.set(property, output);
        }
      });
    });
  }

  return { set, get };
};

export default Topologica;
