import Graph from './graph'

const parse = dependencies => dependencies.split
  ? dependencies.split(',').map(str => str.trim())
  : dependencies;

const Topologica = options => {
  const values = new Map();
  const functions = new Map();
  const graph = Graph();
  const changed = new Set();

  const invoke = property => {
    functions.get(property)();
  };

  const digest = () => {
    graph
      .topologicalSort(Array.from(changed.values()))
      .forEach(invoke);
    changed.clear();
  };

  const set = options => {
    Object.keys(options).forEach(property => {
      const value = options[property];
      if (values.get(property) !== value) {
        values.set(property, value);
        changed.add(property);
      }
    });
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
    Object.keys(options).forEach(property => {
      const fn = options[property];
      const dependencies = parse(fn.dependencies)

      dependencies.forEach(input => {
        graph.addEdge(input, property);
      });

      functions.set(property, () => {
        if (allDefined(dependencies)) {
          values.set(property, fn(getAll(dependencies)));
        }
      });
    });
  }

  return { set, get };
};

export default Topologica;
