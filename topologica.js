const keys = Object.keys;

export default reactiveFunctions => {
  const topologica = function(stateChange) {
    depthFirstSearch(keys(stateChange).map(property => {
      if (topologica[property] !== stateChange[property]) {
        topologica[property] = stateChange[property];
        return property;
      }
    }))
      .reverse()
      .forEach(invoke);
    return topologica;
  };

  const functions = {};
  const edges = {};

  const invoke = property => {
    functions[property]();
  };

  const allDefined = inputs => inputs
    .every(property => topologica[property] !== undefined);

  keys(reactiveFunctions).forEach(property => {
    const reactiveFunction = reactiveFunctions[property];
    let inputs = reactiveFunction.inputs;
    const fn = inputs ? reactiveFunction : reactiveFunction[0];
    inputs = inputs || reactiveFunction[1];

    inputs = inputs.split
      ? inputs.split(',').map(str => str.trim())
      : inputs;

    inputs.forEach(input => {
      (edges[input] = edges[input] || []).push(property);
    });

    functions[property] = () => {
      if (allDefined(inputs)) {
        topologica[property] = fn(topologica);
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

  return topologica;
};
