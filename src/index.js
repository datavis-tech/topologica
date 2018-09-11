import Graph from './graph';

const parseDependencies = dependencies => dependencies.split
  ? dependencies.split(',').map(str => str.trim())
  : dependencies;

const parseReactiveFunction = fn =>
  fn.dependencies
    ? [fn, fn.dependencies]
    : fn;

const Topologica = options => {
  const values = {};
  const functions = {};
  const graph = Graph();

  const invoke = property => {
    functions[property]();
  };

  const set = function(options) {
    graph
      .topologicalSort(Object.keys(options).map(property => {
        if (values[property] !== options[property]) {
          values[property] = options[property];
          return property;
        }
      }))
      .forEach(invoke);
    return this;
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
    let [ fn, dependencies ] = parseReactiveFunction(options[property]);
    dependencies = parseDependencies(dependencies);

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
