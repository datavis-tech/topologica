import Graph from './graph'

const isAsync = fn => fn.constructor.name === 'AsyncFunction';

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

      const propertySync = isAsync(fn) ? property + "'" : property;

      dependencies.forEach(input => {
        graph.addEdge(input, propertySync);
      });

      functions.set(propertySync, () => {
        if (allDefined(dependencies)) {
          const output = fn(getAll(dependencies));
          isAsync(fn)
            ? output.then(value => {
              set({
                [property]: value
              });
            })
            : values.set(property, output);
        }
      });
    });
  }

  return { set, get };
};

export default Topologica;
