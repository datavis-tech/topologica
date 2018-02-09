export default () => {
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
    const visited = new Set();
    const nodeList = [];

    const DFSVisit = node => {
      if (!visited.has(node)) {
        visited.add(node);
        adjacent(node).forEach(DFSVisit);
        nodeList.push(node);
      }
    };

    sourceNodes.forEach(node => {
      visited.add(node);
    });

    sourceNodes.forEach(node => {
      adjacent(node).forEach(DFSVisit);
    });

    return nodeList;
  }

  const topologicalSort = sourceNodes => {
    return depthFirstSearch(sourceNodes).reverse();
  };

  return { addEdge, topologicalSort };
}