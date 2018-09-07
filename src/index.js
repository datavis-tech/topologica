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

  let dependenciesObject;
  const defined = property => {
    if (values[property] !== undefined) {
      dependenciesObject[property] = values[property];
      return true;
    }
  }

  if (options) {
    Object.keys(options).forEach(property => {
      const fn = options[property];
      const dependencies = parse(fn.dependencies)

      dependencies.forEach(input => {
        graph.addEdge(input, property);
      });

      functions[property] = () => {
        dependenciesObject = {};
        if (dependencies.every(defined)) {
          values[property] = fn(dependenciesObject);
        }
      };
    });
  }

  return {
    set,
    get: () => values
  };
};

export default Topologica;
