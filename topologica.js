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

  const allDefined = dependencies => dependencies
    .every(property => dataflow[property] !== undefined);

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
      if (allDefined(dependencies)) {
        dataflow[property] = fn(dataflow);
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
