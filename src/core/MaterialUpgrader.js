import * as THREE from 'three';

/**
 * MaterialUpgrader: converts legacy Lambert materials to soft PBR (MeshStandardMaterial)
 * so they pick up the sky environment light, and tones down flat-UI saturation.
 * Shared materials stay shared (cached by source uuid). Safe to run repeatedly.
 */
const cache = new WeakMap();
const hsl = { h: 0, s: 0, l: 0 };

function convert(src) {
  if (cache.has(src)) return cache.get(src);
  const isClear = src.transparent && src.opacity < 1;

  const color = src.color.clone();
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s * 0.86, hsl.l);

  const mat = new THREE.MeshStandardMaterial({
    color,
    map: src.map || null,
    emissive: src.emissive ? src.emissive.clone() : 0x000000,
    emissiveIntensity: src.emissiveIntensity ?? 1,
    transparent: src.transparent,
    opacity: src.opacity,
    side: src.side,
    vertexColors: src.vertexColors,
    alphaTest: src.alphaTest,
    depthWrite: src.depthWrite,
    // Glass / water read as glossy; everything else as matte painted surfaces
    roughness: isClear ? 0.08 : 0.8,
    metalness: 0,
    envMapIntensity: isClear ? 1.6 : 1.0,
    polygonOffset: src.polygonOffset,
    polygonOffsetFactor: src.polygonOffsetFactor,
    polygonOffsetUnits: src.polygonOffsetUnits
  });
  mat.name = src.name;
  mat.userData = { ...src.userData, upgraded: true };
  cache.set(src, mat);
  return mat;
}

export function upgradeMaterials(root) {
  root.traverse(node => {
    if (!node.isMesh) return;
    if (Array.isArray(node.material)) {
      node.material = node.material.map(m => (m && m.isMeshLambertMaterial ? convert(m) : m));
    } else if (node.material && node.material.isMeshLambertMaterial) {
      node.material = convert(node.material);
    }
  });
}
