const keys = Object.keys;

export default reactiveFunctions => {
  const dataflow = function(stateChange) {
    depthFirstSearch(keys(stateChange).map(property => {
      if (dataflow[property] !== stateChange[property]) {
        dataflow[property] = stateChange[property];
        return property;
      }
    }))
      .reverse()
      .forEach(invoke);
    return this;
  };

  const functions = {};
  const edges = {};

  const invoke = property => {
    functions[property]();
  };

  const allDefined = dependencies => {
    const arg = {};
    return dependencies.every(property => {
      if (dataflow[property] !== undefined){
        arg[property] = dataflow[property];
        return true;
      }
    }) ? arg : null;
  };

  keys(reactiveFunctions).forEach(property => {
    const reactiveFunction = reactiveFunctions[property];
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
        dataflow[property] = fn(arg);
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

  return {
    set: dataflow,
    get: () => dataflow
  };
};
