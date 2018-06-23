import Graph from './graph'

const isPromise = output => output && typeof output.then === 'function';

export const DataFlowGraph = options => {
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

  const getAll = properties => properties
    .reduce((obj, property) => (obj[property] = get(property), obj), {});

  const allDefined = properties => properties
    .every(property => values.has(property))

  if (options) {
    Object.entries(options).forEach(entry => {
      const [ property, { fn, inputs } ] = entry;

      inputs.forEach(input => {
        graph.addEdge(input, property);
      });

      functions.set(property, () => {
        if (allDefined(inputs)) {
          const output = fn(getAll(inputs));
          if (isPromise(output)) {
            //values.set(property, undefined);
            output.then(value => set({[property]: value}));
          } else {
            values.set(property, output);
          }
        }
      });
    });
  }

  return { set, get };
};
