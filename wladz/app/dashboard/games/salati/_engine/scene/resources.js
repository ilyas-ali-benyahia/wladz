/** Dispose shared geometries/materials once, including optional textures. */
export function disposeTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const m of (Array.isArray(object.material) ? object.material : object.material ? [object.material] : [])) materials.add(m);
  });
  for (const m of materials) for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
  textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
}
