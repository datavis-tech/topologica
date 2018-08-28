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

    function DFSVisit(node) {
      if (!visited.has(node)) {
        visit(node);
        nodeList.push(node);
      }
    };

    function visit(node) {
      visited.add(node);
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
}
