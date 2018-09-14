const keys = Object.keys;

export default options => {
  const state = {};
  const functions = {};
  const edges = {};

  const invoke = property => {
    functions[property]();
  };

  const allDefined = dependencies => {
    const arg = {};
    return dependencies.every(property => {
      if (state[property] !== undefined){
        arg[property] = state[property];
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
      (edges[input] = edges[input] || []).push(property);
    });

    functions[property] = () => {
      const arg = allDefined(dependencies);
      if (arg) {
        state[property] = fn(arg);
      }
    };
  });

  const depthFirstSearch = sourceNodes => {
    const visited = {};
    const nodeList = [];

    const search = node => {
      if (!visited[node]) {
        visit(node);
        nodeList.push(node);
      }
    };

    const visit = node => {
      visited[node] = true;
      edges[node] && edges[node].forEach(search);
    }

    sourceNodes.forEach(visit);

    return nodeList;
  }

  const set = function(options) {
    depthFirstSearch(keys(options).map(property => {
      if (state[property] !== options[property]) {
        state[property] = options[property];
        return property;
      }
    }))
      .reverse()
      .forEach(invoke);
    return this;
  };

  return {
    set,
    get: () => state
  };
};
