export function layerOf(y) {
  return y < 0.1 ? 'ground' : 'upper';
}

export function linksInLayer(nodes, layer) {
  const edges = [];
  const seen = new Set();
  nodes.forEach(([x, y, z, links], i) => {
    if (layer !== 'all' && layerOf(y) !== layer) return;
    for (const j of links) {
      const [endX, endY, endZ] = nodes[j];
      if (layer !== 'all' && layerOf(endY) !== layer) continue;
      const key = `${Math.min(i, j)}:${Math.max(i, j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ x, y, z, endX, endY, endZ });
    }
  });
  return edges;
}
