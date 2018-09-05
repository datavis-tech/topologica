import Graph from './graph'

const parse = dependencies => dependencies.split
  ? dependencies.split(',').map(str => str.trim())
  : dependencies;

const Topologica = options => {
  const values = {};
  const functions = {};
  let changed = {};
  const graph = Graph();

  const invoke = property => {
    functions[property]();
  };

  const digest = () => {
    graph
      .topologicalSort(Object.keys(changed))
      .forEach(invoke);
    changed = {};
  };

  const set = options => {
    Object.keys(options).forEach(property => {
      const value = options[property];
      if (values[property] !== value) {
        values[property] = value;
        changed[property] = true;
      }
    });
    digest();
  };

  const get = property => values[property];

  const allDefined = properties => properties
    .every(property => values[property] !== undefined);

  if (options) {
    Object.keys(options).forEach(property => {
      const fn = options[property];
      const dependencies = parse(fn.dependencies)

      dependencies.forEach(input => {
        graph.addEdge(input, property);
      });

      functions[property] = () => {
        if (allDefined(dependencies)) {
          values[property] = fn(values);
        }
      };
    });
  }

  return { set, get };
};

export default Topologica;
