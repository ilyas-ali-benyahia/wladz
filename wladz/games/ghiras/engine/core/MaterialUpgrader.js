import * as THREE from 'three';

/**
 * MaterialUpgrader: converts legacy Lambert materials to soft PBR (MeshStandardMaterial)
 * so they pick up the sky environment light, and tones down flat-UI saturation.
 * Shared materials stay shared (cached by source uuid). Safe to run repeatedly.
 */
const cache = new WeakMap();
const hsl = { h: 0, s: 0, l: 0 };

// World-space surface detail shared by all environment materials (no textures / UVs needed):
// - low-contrast grain that breaks up flat CG colour
// - contact shading where vertical surfaces meet the ground (cheap fake ambient occlusion)
// - optional anti-aliased paving joints on horizontal surfaces (fades out with distance)
const DETAIL_VERTEX_HEAD = `
varying vec3 vDetailPos;
varying vec3 vDetailNrm;
`;
const DETAIL_FRAGMENT_HEAD = `
varying vec3 vDetailPos;
varying vec3 vDetailNrm;
uniform float uGrain;
uniform float uTile;
float dHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;
const DETAIL_FRAGMENT_BODY = `
{
  vec3 wn = normalize(vDetailNrm);
  float n = dNoise(vDetailPos * 1.7) * 0.55 + dNoise(vDetailPos * 0.21) * 0.45;
  diffuseColor.rgb *= 1.0 + (n - 0.5) * 2.0 * uGrain;
  float vert = 1.0 - abs(wn.y);
  diffuseColor.rgb *= mix(1.0, mix(0.6, 1.0, smoothstep(0.0, 0.9, vDetailPos.y)), vert);
  if (uTile > 0.0) {
    vec2 q = vDetailPos.xz / uTile;
    vec2 fw = fwidth(q);
    vec2 d = min(fract(q), 1.0 - fract(q));
    vec2 l = 1.0 - smoothstep(vec2(0.0), fw * 1.5 + 0.025, d);
    float fade = 1.0 - smoothstep(0.08, 0.3, max(fw.x, fw.y));
    diffuseColor.rgb *= 1.0 - max(l.x, l.y) * 0.2 * fade * abs(wn.y);
  }
}
`;

/** Adds world-space grain, contact shading and optional paving joints (tile = joint spacing in metres) */
export function addSurfaceDetail(mat, grain = 0.05, tile = 0) {
  if (mat.userData.surfaceDetail) return mat;
  mat.userData.surfaceDetail = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGrain = { value: grain };
    shader.uniforms.uTile = { value: tile };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>' + DETAIL_VERTEX_HEAD)
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvDetailPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvDetailNrm = mat3(modelMatrix) * objectNormal;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + DETAIL_FRAGMENT_HEAD)
      .replace('#include <color_fragment>', '#include <color_fragment>' + DETAIL_FRAGMENT_BODY);
  };
  mat.customProgramCacheKey = () => 'surfaceDetail';
  mat.needsUpdate = true;
  return mat;
}

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
  if (!isClear) addSurfaceDetail(mat, 0.05);
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
