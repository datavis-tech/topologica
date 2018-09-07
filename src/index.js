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
    graph
      .topologicalSort(Object.keys(options).map(property => {
        if (values[property] !== options[property]) {
          values[property] = options[property];
          return property;
        }
      }))
      .forEach(invoke);
  };

  const allDefined = dependencies => {
    const arg = {};
    return dependencies.every(property => {
      if (values[property] !== undefined){
        arg[property] = values[property];
        return true;
      }
    }) ? arg : null;
  };

  Object.keys(options).forEach(property => {
    const fn = options[property];
    const dependencies = parse(fn.dependencies)

    dependencies.forEach(input => {
      graph.addEdge(input, property);
    });

    functions[property] = () => {
      const arg = allDefined(dependencies);
      if (arg) {
        values[property] = fn(arg);
      }
    };
  });

  return {
    set,
    get: () => values
  };
};

export default Topologica;
