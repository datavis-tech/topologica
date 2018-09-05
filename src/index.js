import Graph from './graph'

const parse = dependencies => dependencies.split
  ? dependencies.split(',').map(str => str.trim())
  : dependencies;

const Topologica = options => {
  const values = {};
  const functions = {};
  const graph = Graph();

  const invoke = property => {
    functions[property]();
  };

  const set = options => {
    const changed = [];
    Object.keys(options).forEach(property => {
      if (values[property] !== options[property]) {
        values[property] = options[property];
        changed.push(property);
      }
    });

    graph
      .topologicalSort(changed)
      .forEach(invoke);
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
