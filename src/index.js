import Graph from './graph';

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
    let fn = options[property];
    const dependencies = parse(fn.dependencies || fn[1]);
    fn = fn.dependencies ? fn : fn[0];

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
