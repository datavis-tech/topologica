const keys = Object.keys;

export default options => {
  const values = {};
  const functions = {};
  const edges = {};
  const adjacent = node => edges[node] || [];

  const addNode = node => {
    edges[node] = adjacent(node);
  };

  const addEdge = (u, v) => {
    addNode(u);
    addNode(v);
    adjacent(u).push(v);
  };

  const depthFirstSearch = sourceNodes => {
    const visited = {};
    const nodeList = [];

    const DFSVisit = node => {
      if (!visited[node]) {
        visit(node);
        nodeList.push(node);
      }
    };

    const visit = node => {
      visited[node] = true;
      adjacent(node).forEach(DFSVisit);
    }

    sourceNodes.forEach(visit);

    return nodeList;
  }

  const invoke = property => {
    functions[property]();
  };

  const set = function(options) {
    depthFirstSearch(keys(options).map(property => {
      if (values[property] !== options[property]) {
        values[property] = options[property];
        return property;
      }
    }))
      .reverse()
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

  keys(options).forEach(property => {
    const reactiveFunction = options[property];
    let dependencies = reactiveFunction.dependencies;
    const fn = dependencies ? reactiveFunction : reactiveFunction[0];
    dependencies = dependencies || reactiveFunction[1];

    dependencies = dependencies.split
      ? dependencies.split(',').map(str => str.trim())
      : dependencies;

    dependencies.forEach(input => {
      addEdge(input, property);
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
