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

  const topologicalSort = sourceNodes =>
    depthFirstSearch(sourceNodes)
      .reverse();

  return {
    addEdge,
    topologicalSort
  };
};
