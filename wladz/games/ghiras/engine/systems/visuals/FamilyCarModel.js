import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Smooth stylized compact family car (procedural, no external assets).
 * Body and glasshouse are bevelled extrusions of a side profile with real wheel arches,
 * so the silhouette reads as a car from every angle (no stacked boxes).
 * Returns { group, wheels: [{ steer, spin }], halfWidth, halfLength }; the car faces +z.
 */
const WIDTH = 1.78;
const BEVEL = 0.13;

function extrudeProfile(points, depth, bevel) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 18
  });
  // Profile (u = forward, v = up) -> world: u -> +z, v -> +y, extrusion -> x, centred
  geo.rotateY(-Math.PI / 2);
  geo.translate(depth / 2, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

export function createFamilyCar(colorHex = 0x2e86c1) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.32, metalness: 0.25 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1d2c3a, roughness: 0.08, metalness: 0.1, envMapIntensity: 1.6 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd7dde2, roughness: 0.25, metalness: 0.8 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.9 });

  // Lower body: hatchback side profile with front and rear wheel arches
  // Arch radius includes the bevel, which grows the outline inward around the wheel
  const arches = [{ c: 1.28, y: 0.4, r: 0.6 }, { c: -1.28, y: 0.4, r: 0.6 }];
  const body = new THREE.Mesh(buildBody(arches), paint);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Glasshouse (tinted windows all round) and a painted roof cap
  const cabin = new THREE.Mesh(extrudeProfile([
    [0.92, 1.02], [-1.62, 1.02], [-1.4, 1.52], [0.3, 1.58]
  ], WIDTH - 0.5, 0.1), glass);
  cabin.castShadow = true;
  group.add(cabin);
  const roof = new THREE.Mesh(extrudeProfile([
    [0.34, 1.53], [-1.42, 1.48], [-1.38, 1.6], [0.28, 1.64]
  ], WIDTH - 0.44, 0.06), paint);
  roof.castShadow = true;
  group.add(roof);
  // B-pillars
  [-1, 1].forEach(s => {
    const pillar = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.52, 0.12, 2, 0.025), paint);
    pillar.position.set(s * (WIDTH / 2 - 0.2), 1.29, -0.42);
    pillar.rotation.x = -0.08;
    group.add(pillar);
  });

  // Bumpers (rounded), grille and number plates
  [[2.15, 1], [-2.13, -1]].forEach(([z]) => {
    const bumper = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, WIDTH - 0.3, 4, 12), trim);
    bumper.rotation.z = Math.PI / 2;
    bumper.position.set(0, 0.46, z);
    group.add(bumper);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.12), new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.5 }));
    plate.position.set(0, 0.64, z + Math.sign(z) * 0.0);
    if (z < 0) plate.rotation.y = Math.PI;
    group.add(plate);
  });
  const grille = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.16, 0.06, 2, 0.03), trim);
  grille.position.set(0, 0.8, 2.08);
  group.add(grille);

  // Lights: warm headlamps (emissive), red tail lamps
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff8e1, emissive: 0xfff1c4, emissiveIntensity: 0.6, roughness: 0.2 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x7b1010, emissiveIntensity: 0.5, roughness: 0.3 });
  [-1, 1].forEach(s => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), headMat);
    head.scale.set(1.3, 0.62, 0.45);
    head.position.set(s * 0.6, 0.82, 2.06);
    group.add(head);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), tailMat);
    tail.scale.set(1.2, 0.8, 0.4);
    tail.position.set(s * 0.66, 0.86, -2.07);
    group.add(tail);
    // Mirrors
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.12, 0.2, 2, 0.04), paint);
    mirror.position.set(s * (WIDTH / 2 + 0.06), 1.1, 0.78);
    group.add(mirror);
    // Door handles
    const handle = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.04, 0.18, 1, 0.015), chrome);
    handle.position.set(s * (WIDTH / 2 + 0.005), 0.92, 0.05);
    group.add(handle);
  });
  group.userData.headMat = headMat;

  // Wheels: steer pivot (front) -> spin group -> rounded tyre + rim
  const tyreGeo = new THREE.TorusGeometry(0.3, 0.12, 12, 28);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 20);
  const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10);
  const wheels = [];
  [[1.28, true], [-1.28, false]].forEach(([z, front]) => {
    [-1, 1].forEach(s => {
      const steer = new THREE.Group();
      steer.position.set(s * (WIDTH / 2 - 0.12), 0.42, z);
      const spin = new THREE.Group();
      steer.add(spin);
      const t = new THREE.Mesh(tyreGeo, tyre);
      t.rotation.y = Math.PI / 2;
      t.castShadow = true;
      spin.add(t);
      const rim = new THREE.Mesh(rimGeo, chrome);
      rim.rotation.z = Math.PI / 2;
      spin.add(rim);
      const hub = new THREE.Mesh(hubGeo, trim);
      hub.rotation.z = Math.PI / 2;
      spin.add(hub);
      // Spokes make the rotation visible
      for (let k = 0; k < 5; k++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.05), trim);
        spoke.position.x = s * 0.085;
        spoke.rotation.x = (k / 5) * Math.PI;
        spin.add(spoke);
      }
      group.add(steer);
      wheels.push({ steer, spin, front });
    });
  });

  return { group, wheels, halfWidth: WIDTH / 2 + 0.06, halfLength: 2.25 };
}

/** Lower body profile: flat floor broken by two wheel arches, rounded nose and tail */
function buildBody(arches) {
  const shape = new THREE.Shape();
  const [fa, ra] = arches;
  shape.moveTo(2.0, 0.6);
  shape.lineTo(1.92, 0.32);
  shape.lineTo(fa.c + fa.r, 0.32);
  shape.absarc(fa.c, fa.y, fa.r, 0, Math.PI, false);
  shape.lineTo(ra.c + ra.r, 0.32);
  shape.absarc(ra.c, ra.y, ra.r, 0, Math.PI, false);
  shape.lineTo(-1.92, 0.32);
  shape.lineTo(-1.99, 0.62);
  shape.quadraticCurveTo(-2.0, 0.98, -1.86, 1.0);
  shape.lineTo(0.95, 1.04);
  shape.quadraticCurveTo(1.7, 0.98, 1.95, 0.86);
  shape.quadraticCurveTo(2.04, 0.74, 2.0, 0.6);
  const depth = WIDTH - BEVEL * 2;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 20
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(depth / 2, 0, 0);
  geo.computeVertexNormals();
  return geo;
}
