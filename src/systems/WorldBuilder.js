import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { addSurfaceDetail } from '../core/MaterialUpgrader.js';
import { CartoonSkySystem } from './visuals/CartoonSkySystem.js';
import { CartoonNatureGenerator } from './visuals/CartoonNatureGenerator.js';
import { CartoonVehicleGenerator } from './visuals/CartoonVehicleGenerator.js';
import { CartoonStreetPropsGenerator } from './visuals/CartoonStreetPropsGenerator.js';
import { CartoonBuildingGenerator } from './visuals/CartoonBuildingGenerator.js';
import { TerrainGenerator, edgeDistance } from './visuals/TerrainGenerator.js';

export class WorldBuilder {
  constructor(engine, collisionSystem) {
    this.engine = engine;
    this.collisionSystem = collisionSystem;
    this.scene = engine.scene;

    this.streetLights = [];
    this.fountains = [];
    this.plantSpots = [];
    this.waterMeshes = [];

    // Initialize Stylized Cartoon Generators
    this.sky = new CartoonSkySystem(this.scene);
    this.nature = new CartoonNatureGenerator(this.scene);
    this.vehicles = new CartoonVehicleGenerator(this.scene);
    this.streetProps = new CartoonStreetPropsGenerator(this.scene);
    this.buildings = new CartoonBuildingGenerator(this.scene);

    this.buildCity();
  }

  buildCity() {
    this.createGroundAndRoads();
    this.createPlazaMonument();
    this.createMosque();
    this.createMuseum();
    this.createSchool();
    this.createLibrary();
    this.createHealthCenter();
    this.createCentralPark();
    this.createSouk();
    this.createResidentialQuarter();
    this.createStreetFurniture();
    this.createShowcaseSection();
    this.createPoliceStationBuilding();
    this.createCivilProtectionStationBuilding();
    this.createTownHallBuilding();
    this.createCasbahHeritageQuarter();
    this.createPlayerHome();
  }

  // ═════════════════════════════════════════════════════
  // 1. Ground & Road Network (Grid & Parcels)
  // ═════════════════════════════════════════════════════
  createGroundAndRoads() {
    // One continuous terrain: city lawn plus the mountain range that closes the map
    this.terrain = new TerrainGenerator(this.scene).build();
    this.collisionSystem.edgeDistance = edgeDistance;

    // Road network: main avenue (شارع أول نوفمبر), main boulevard (نهج الشهداء) and the outer ring roads
    this.roadDefs = [
      { cx: 0, cz: 0, w: 160, d: 8, h: true },
      { cx: 0, cz: 0, w: 8, d: 160, h: false },
      { cx: 0, cz: -42, w: 150, d: 7, h: true },
      { cx: 0, cz: 42, w: 150, d: 7, h: true },
      { cx: -42, cz: 0, w: 7, d: 150, h: false },
      { cx: 42, cz: 0, w: 7, d: 150, h: false }
    ];
    this.roundaboutRadius = 9.5; // outer edge of the central roundabout lane
    this.roundaboutIsland = 4.6; // central island with the monument

    this.roadDefs.forEach(r => this.createRoadSegment(r.cx, r.cz, r.w, r.d, r.h));
    this.buildSidewalks();
    this.terrain.buildRoadEnds(this.roadMats.road);
    this.terrain.solids.forEach(b => this.collisionSystem.addBox(b.min.x, b.min.z, b.max.x, b.max.z, b.max.y));
  }

  /** True if a lane-marking dash at (x, z) would sit inside a crossing road or the roundabout */
  isInsideJunction(x, z, isHorizontal) {
    if (Math.hypot(x, z) < this.roundaboutRadius + 3) return true;
    return this.roadDefs.some(r => {
      if (r.h === isHorizontal) return false;
      return isHorizontal
        ? Math.abs(x - r.cx) < r.w / 2 + 2.2 && Math.abs(z - r.cz) <= r.d / 2
        : Math.abs(z - r.cz) < r.d / 2 + 2.2 && Math.abs(x - r.cx) <= r.w / 2;
    });
  }

  /** Sidewalks run along every road but stop at crossing roads, so junctions are clean asphalt */
  buildSidewalks() {
    const SW = 5.5;
    const R = this.roundaboutRadius;
    const mat = this.roadMats.curb;

    this.roadDefs.forEach(road => {
      const isH = road.h;
      const half = (isH ? road.d : road.w) / 2;
      const runMin = isH ? road.cx - road.w / 2 : road.cz - road.d / 2;
      const runMax = isH ? road.cx + road.w / 2 : road.cz + road.d / 2;
      [-1, 1].forEach(side => {
        const fixed = (isH ? road.cz : road.cx) + side * (half + SW / 2);
        const cuts = [];
        this.roadDefs.forEach(o => {
          if (o.h === isH) return;
          const along = isH ? o.cx : o.cz;
          const oHalf = (isH ? o.w : o.d) / 2;
          const sMin = isH ? o.cz - o.d / 2 : o.cx - o.w / 2;
          const sMax = isH ? o.cz + o.d / 2 : o.cx + o.w / 2;
          if (fixed >= sMin && fixed <= sMax) cuts.push([along - oHalf, along + oHalf]);
        });
        if (Math.abs(fixed) < R) cuts.push([-R, R]); // roundabout gets curved corners instead
        cuts.sort((a, b) => a[0] - b[0]);

        let start = runMin;
        const pieces = [];
        cuts.forEach(([a, b]) => {
          if (a > start) pieces.push([start, Math.min(a, runMax)]);
          start = Math.max(start, b);
        });
        if (start < runMax) pieces.push([start, runMax]);
        pieces.forEach(([a, b]) => {
          if (b - a < 0.3) return;
          const mid = (a + b) / 2;
          if (isH) this.createSidewalk(mid, fixed, b - a, SW, mat);
          else this.createSidewalk(fixed, mid, SW, b - a, mat);
        });
      });
    });

    // Curved sidewalk corners around the roundabout (square corner minus the circular lane)
    const inner = 4;
    const outer = inner + SW;
    const cut = Math.sqrt(R * R - inner * inner);
    const shape = new THREE.Shape();
    shape.moveTo(cut, inner);
    shape.lineTo(outer, inner);
    shape.lineTo(outer, outer);
    shape.lineTo(inner, outer);
    shape.lineTo(inner, cut);
    shape.absarc(0, 0, R, Math.atan2(cut, inner), Math.atan2(inner, cut), true);
    const cornerGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false, curveSegments: 24 });
    cornerGeo.rotateX(Math.PI / 2);
    cornerGeo.translate(0, 0.2, 0);
    const cornerMat = mat.clone();
    cornerMat.side = THREE.DoubleSide; // mirrored corners flip triangle winding
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
      const corner = new THREE.Mesh(cornerGeo, cornerMat);
      corner.scale.set(sx, 1, sz);
      corner.receiveShadow = true;
      this.scene.add(corner);
    });

    // Roundabout lane asphalt
    const lane = new THREE.Mesh(new THREE.CircleGeometry(R, 64), this.roadMats.road);
    lane.rotation.x = -Math.PI / 2;
    lane.position.y = 0.01;
    lane.receiveShadow = true;
    this.scene.add(lane);
  }

  createRoadSegment(cx, cz, w, d, isHorizontal) {
    // Shared materials; ground-layer decals use polygonOffset instead of tiny height gaps (no flicker)
    const decal = (color, layer) => new THREE.MeshStandardMaterial({
      color, roughness: 0.75, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer * 2
    });
    this.roadMats = this.roadMats || {
      road: addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.92, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), 0.1),
      line: decal(0xe8b923, 2),
      stripe: decal(0xf2f2ee, 3),
      curb: addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xc2b9a9, roughness: 0.88, metalness: 0 }), 0.06, 0.6)
    };
    const roadMat = this.roadMats.road;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(cx, 0.01, cz);
    road.receiveShadow = true;
    this.scene.add(road);

    const lineMat = this.roadMats.line;

    if (isHorizontal) {
      // Yellow dashed lane divider
      for (let x = -w / 2 + 5; x < w / 2 - 5; x += 6) {
        if (this.isInsideJunction(cx + x, cz, true)) continue;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.3), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(cx + x, 0.02, cz);
        dash.receiveShadow = true;
        this.scene.add(dash);
      }
      // Wide Crosswalks at avenue crossings
      this.createCrosswalk(16, cz, isHorizontal);
      this.createCrosswalk(-16, cz, isHorizontal);
    } else {
      for (let z = -d / 2 + 5; z < d / 2 - 5; z += 6) {
        if (this.isInsideJunction(cx, cz + z, false)) continue;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3.2), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(cx, 0.02, cz + z);
        dash.receiveShadow = true;
        this.scene.add(dash);
      }
      // Wide Crosswalks
      this.createCrosswalk(cx, 16, isHorizontal);
      this.createCrosswalk(cx, -16, isHorizontal);
    }
  }

  createSidewalk(x, z, w, d, mat) {
    // Distinctive, clean paved Algerian pedestrian sidewalk with safe raised curb
    // Bevelled edge softens the hard road-to-sidewalk step
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, 0.20, d, 2, 0.06), mat);
    mesh.position.set(x, 0.10, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createCrosswalk(cx, cz, isHorizontal) {
    const stripeMat = this.roadMats.stripe;
    if (isHorizontal) {
      for (let i = -3.5; i <= 3.5; i += 1.1) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(cx, 0.025, cz + i);
        stripe.receiveShadow = true;
        this.scene.add(stripe);
      }
    } else {
      for (let i = -3.5; i <= 3.5; i += 1.1) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.4), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(cx + i, 0.025, cz);
        stripe.receiveShadow = true;
        this.scene.add(stripe);
      }
    }
  }

  // ═════════════════════════════════════════════════════
  // 2. Central Plaza & Independence Monument (ساحة الاستقلال)
  // ═════════════════════════════════════════════════════
  createPlazaMonument() {
    // Independence monument on a compact roundabout island (traffic circulates around it)
    const R = this.roundaboutIsland;
    const isle = new THREE.Group();
    this.scene.add(isle);

    const curb = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R + 0.15, 0.3, 48),
      addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.85 }), 0.05)
    );
    curb.position.y = 0.15;
    curb.receiveShadow = true;
    isle.add(curb);
    const lawn = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.35, R - 0.35, 0.06, 48),
      addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0x5a8f3c, roughness: 0.95 }), 0.08)
    );
    lawn.position.y = 0.31;
    lawn.receiveShadow = true;
    isle.add(lawn);

    // Monument (scaled to fit the island)
    const monument = new THREE.Group();
    monument.position.y = 0.3;
    monument.scale.setScalar(0.62);
    isle.add(monument);

    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 0.4, 32), new THREE.MeshLambertMaterial({ color: 0xf5f6fa }));
    step1.position.y = 0.2;
    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.8, 32), new THREE.MeshLambertMaterial({ color: 0xecf0f1 }));
    step2.position.y = 0.8;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7.8, 24), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    pillar.position.y = 5.0;
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 10, 24, Math.PI * 1.5), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
    crescent.position.y = 9.4;
    crescent.rotation.y = Math.PI / 4;
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.24, 5), new THREE.MeshLambertMaterial({ color: 0xf1c40f, side: THREE.DoubleSide }));
    star.position.set(0.13, 9.4, 0.13);
    star.rotation.y = Math.PI / 4;
    [step1, step2, pillar, crescent, star].forEach(m => { m.castShadow = true; m.receiveShadow = true; monument.add(m); });

    // Flower bushes ringing the monument base
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      const bush = this.nature.createCartoonBush(Math.cos(ang) * 3.4, Math.sin(ang) * 3.4, 0.55, i % 2 ? 'autumn' : 'cyan');
      bush.position.y = 0.3;
    }

    // Lanterns on the four curved corner sidewalks
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
      const lamp = this.streetProps.createGlobeStreetLamp(sx * 7.6, sz * 7.6, 0.85);
      this.streetLights.push(lamp.light);
    });

    this.collisionSystem.addBox(-R * 0.85, -R * 0.85, R * 0.85, R * 0.85, 10);
  }

  // ═════════════════════════════════════════════════════
  // 3. The Great Algerian Mosque (المسجد الكبير)
  // ═════════════════════════════════════════════════════
  createMosque() {
    const mx = -62;
    const mz = 22;

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xfbfcfe });
    const emeraldMat = new THREE.MeshLambertMaterial({ color: 0x16a085 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f });
    const tileMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });

    // Mosque Courtyard Paved Base
    const courtBase = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 20), new THREE.MeshLambertMaterial({ color: 0xf5f6fa }));
    courtBase.position.set(mx, 0.08, mz - 3);
    courtBase.receiveShadow = true;
    this.scene.add(courtBase);

    // Mosque Main Prayer Hall
    const hall = new THREE.Mesh(new THREE.BoxGeometry(15, 9, 13), wallMat);
    hall.position.set(mx, 4.5, mz);
    hall.castShadow = true;
    hall.receiveShadow = true;
    this.scene.add(hall);

    // Decorative Zillij Mosaic Border on top of hall
    const border = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.5, 13.4), tileMat);
    border.position.set(mx, 9.2, mz);
    this.scene.add(border);

    // Grand Emerald Green Dome (قبة زمردية فخمة)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), emeraldMat);
    dome.position.set(mx, 9.4, mz);
    dome.castShadow = true;
    this.scene.add(dome);

    // Dome Gold Crescent
    const domeCrescent = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.09, 8, 16, Math.PI * 1.5), goldMat);
    domeCrescent.position.set(mx, 14.5, mz);
    domeCrescent.rotation.y = Math.PI / 4;
    this.scene.add(domeCrescent);

    // Authentic Square Moorish Minaret (مئذنة مغاربية مزخرفة)
    const minX = mx - 8.5;
    const minZ = mz + 6.5;
    const minaret = new THREE.Mesh(new THREE.BoxGeometry(3.6, 24, 3.6), wallMat);
    minaret.position.set(minX, 12, minZ);
    minaret.castShadow = true;
    this.scene.add(minaret);

    // Minaret Balcony with Arched Windows
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 4.2), emeraldMat);
    balcony.position.set(minX, 24.5, minZ);
    this.scene.add(balcony);

    // Minaret Turret & Gold Crescent Top
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3.8, 8), emeraldMat);
    turret.position.set(minX, 27.0, minZ);
    this.scene.add(turret);

    const minCrescent = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 6, 12, Math.PI * 1.4), goldMat);
    minCrescent.position.set(minX, 29.4, minZ);
    this.scene.add(minCrescent);

    // Arched Courtyard Entrance Gate with Mounted Sign (NO FLOATING SIGN)
    const gateWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.8), wallMat);
    gateWall.position.set(mx, 2.1, mz - 11);
    gateWall.castShadow = true;
    this.scene.add(gateWall);

    // Moorish Arch Cutout simulation / pillars
    [-3.5, 3.5].forEach(px => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 4.2, 10), wallMat);
      col.position.set(mx + px, 2.1, mz - 10.8);
      this.scene.add(col);
    });

    // Sign attached securely to the archway gate
    this.createMountedSign(mx, 3.5, mz - 10.3, '🕌 المسجد الكبير - مركز الهدى والقيم', 0x16a085);

    // Marble Courtyard Fountain
    this.createCourtyardFountain(mx, mz - 5);

    // Palm trees in courtyard corners
    this.createPalmTree(mx - 8, mz - 9);
    this.createPalmTree(mx + 8, mz - 9);

    this.collisionSystem.addBox(mx - 11, mz - 12, mx + 8.5, mz + 8, 28);
  }

  createCourtyardFountain(x, z) {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.6, 16), new THREE.MeshLambertMaterial({ color: 0xecf0f1 }));
    basin.position.set(x, 0.35, z);
    basin.castShadow = true;
    this.scene.add(basin);

    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.15, 16), new THREE.MeshLambertMaterial({ color: 0x0984e3, transparent: true, opacity: 0.85 }));
    water.position.set(x, 0.55, z);
    this.scene.add(water);
    this.waterMeshes.push(water);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 8), new THREE.MeshLambertMaterial({ color: 0xecf0f1 }));
    pillar.position.set(x, 1.0, z);
    this.scene.add(pillar);

    this.collisionSystem.addBox(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 2.0);
  }

  // ═════════════════════════════════════════════════════
  // 4. The National Museum of Algerian History (المتحف الوطني)
  // ═════════════════════════════════════════════════════
  createMuseum() {
    const mx = 21;
    const mz = -23;

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xefeae1 });
    const marbleMat = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x8e44ad });

    // Grand Monumental Steps
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(18 - s * 1.5, 0.35, 16 + (3 - s) * 1.2), stoneMat);
      step.position.set(mx, 0.18 + s * 0.35, mz + (3 - s) * 0.6);
      step.receiveShadow = true;
      this.scene.add(step);
    }

    // Main Museum Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 13), stoneMat);
    body.position.set(mx, 5.2, mz);
    body.castShadow = true;
    body.receiveShadow = true;
    this.scene.add(body);

    // Front Portico Classical Columns (6 Grand Columns)
    for (let c = -6; c <= 6; c += 2.4) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 8.2, 12), marbleMat);
      col.position.set(mx + c, 4.8, mz + 7.0);
      col.castShadow = true;
      this.scene.add(col);
    }

    // Pediment (Triangular front gable)
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(8.5, 2.6, 4), roofMat);
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(mx, 10.4, mz + 6.8);
    this.scene.add(pediment);

    // Securely Mounted Museum Sign
    this.createMountedSign(mx, 8.4, mz + 7.2, '🏛️ المتحف الوطني لتاريخ وثورة الجزائر', 0x8e44ad);

    // Dual Algerian Flagpoles on Left and Right of Entrance Steps
    this.createAlgerianFlag(mx - 8, 1.2, mz + 9);
    this.createAlgerianFlag(mx + 8, 1.2, mz + 9);

    this.collisionSystem.addBox(mx - 9, mz - 7.5, mx + 9, mz + 8.5, 14);
  }

  // ═════════════════════════════════════════════════════
  // 5. The Primary School (مدرسة الأمل الابتدائية)
  // ═════════════════════════════════════════════════════
  createSchool() {
    const sx = -63;
    const sz = -21;

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xfffcf0 });
    const blueMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xb33939 });

    // Schoolyard Pavement
    const yard = new THREE.Mesh(new THREE.BoxGeometry(20, 0.12, 18), new THREE.MeshLambertMaterial({ color: 0xdfe6e9 }));
    yard.position.set(sx, 0.06, sz + 2);
    yard.receiveShadow = true;
    this.scene.add(yard);

    // Main School Building
    const school = new THREE.Mesh(new THREE.BoxGeometry(15, 7.5, 11), wallMat);
    school.position.set(sx, 3.75, sz - 2);
    school.castShadow = true;
    school.receiveShadow = true;
    this.scene.add(school);

    // Terracotta roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.6, 11.6), roofMat);
    roof.position.set(sx, 7.8, sz - 2);
    this.scene.add(roof);

    // Clock Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 3.2), blueMat);
    tower.position.set(sx, 9.8, sz - 2);
    tower.castShadow = true;
    this.scene.add(tower);

    // Clock Face
    const clock = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    clock.position.set(sx, 10.0, sz - 0.35);
    this.scene.add(clock);

    // Mounted School Sign
    this.createMountedSign(sx, 5.8, sz + 3.6, '🏫 مدرسة الأمل الابتدائية - صناع المستقبل', 0x2980b9);

    // Flagpole in center of schoolyard
    this.createAlgerianFlag(sx, 0.1, sz + 6, 6);

    this.collisionSystem.addBox(sx - 8.5, sz - 8.5, sx + 8.5, sz + 4.5, 14);
  }

  // ═════════════════════════════════════════════════════
  // 6. The Public Library (المكتبة العامة)
  // ═════════════════════════════════════════════════════
  createLibrary() {
    const lx = -18;
    const lz = -22;

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xecf0f1 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x00cec9, transparent: true, opacity: 0.85 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });

    const lib = new THREE.Mesh(new THREE.BoxGeometry(13, 8.0, 11), wallMat);
    lib.position.set(lx, 4.0, lz);
    lib.castShadow = true;
    this.scene.add(lib);

    // Modern bay glass window with Mashrabiya wooden lattice
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), glassMat);
    glass.position.set(lx, 4.2, lz + 5.55);
    this.scene.add(glass);

    const lattice = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.4, 0.2), woodMat);
    lattice.position.set(lx, 4.2, lz + 5.6);
    this.scene.add(lattice);

    this.createMountedSign(lx, 6.8, lz + 5.6, '📚 المكتبة العامة وواحة العلوم', 0x00b894);
    this.collisionSystem.addBox(lx - 7, lz - 6, lx + 7, lz + 6, 11);
  }

  // ═════════════════════════════════════════════════════
  // 7. The Health Center (المركز الصحي)
  // ═════════════════════════════════════════════════
  createHealthCenter() {
    const hx = 63;
    const hz = -21;

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xf8f9fa });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });

    const clinic = new THREE.Mesh(new THREE.BoxGeometry(12, 7.5, 10), wallMat);
    clinic.position.set(hx, 3.75, hz);
    clinic.castShadow = true;
    this.scene.add(clinic);

    // Red Crescent Emblem
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 8, 16, Math.PI * 1.4), redMat);
    crescent.position.set(hx, 5.8, hz + 5.1);
    this.scene.add(crescent);

    this.createMountedSign(hx, 3.4, hz + 5.1, '🏥 المركز الصحي - رعاية المواطن', 0xe74c3c);
    this.collisionSystem.addBox(hx - 6.5, hz - 5.5, hx + 6.5, hz + 5.5, 10);
  }

  // ═════════════════════════════════════════════════════
  // 8. Central Park (الحديقة المركزية)
  // ═════════════════════════════════════════════════════
  createCentralPark() {
    const px = 21.25;
    const pz = 21.25;

    // Lush green park grass lawn
    const parkGround = new THREE.Mesh(
      new THREE.BoxGeometry(22.5, 0.12, 22.5),
      new THREE.MeshLambertMaterial({ color: 0x388e3c })
    );
    parkGround.position.set(px, 0.06, pz);
    parkGround.receiveShadow = true;
    this.scene.add(parkGround);

    // Stone Walkway Path through park
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 22.5),
      addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), 0.06, 0.5)
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(px, 0.08, pz);
    path.receiveShadow = true;
    this.scene.add(path);

    // Animated Central Fountain
    this.createFountain(px, pz);

    // Plantable soil spots (for Missions 2 & 3) with neat stone borders
    const spotCoords = [
      [px - 7, pz - 5],
      [px + 7, pz - 5],
      [px - 7, pz + 5],
      [px + 7, pz + 5],
      [px - 4, pz + 6],
      [px + 4, pz + 6]
    ];

    spotCoords.forEach(([sx, sz], i) => {
      this.createPlantSpot(sx, sz, i);
    });

    // Park Palm Trees and Shade Trees
    this.createPalmTree(px - 10, pz - 7);
    this.createPalmTree(px + 10, pz - 7);
    this.createPalmTree(px - 10, pz + 7);
    this.createPalmTree(px + 10, pz + 7);

    // Park Benches
    this.createBench(px - 4, pz - 2, 0);
    this.createBench(px + 4, pz - 2, 0);
    this.createBench(px - 4, pz + 2, Math.PI);
    this.createBench(px + 4, pz + 2, Math.PI);
  }

  createFountain(x, z) {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, 0.7, 18), new THREE.MeshLambertMaterial({ color: 0xdfe6e9 }));
    basin.position.set(x, 0.35, z);
    basin.castShadow = true;
    this.scene.add(basin);

    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.18, 18), new THREE.MeshLambertMaterial({ color: 0x0984e3, transparent: true, opacity: 0.85 }));
    water.position.set(x, 0.60, z);
    this.scene.add(water);

    const jetPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0xdfe6e9 }));
    jetPillar.position.set(x, 1.1, z);
    this.scene.add(jetPillar);

    this.fountains.push({ waterMesh: water, x, z });
    this.collisionSystem.addBox(x - 3.2, z - 3.2, x + 3.2, z + 3.2, 2.5);
  }

  createPlantSpot(x, z, id) {
    // Stone ring border
    const border = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.12, 16),
      new THREE.MeshLambertMaterial({ color: 0x95a5a6 })
    );
    border.position.set(x, 0.07, z);
    this.scene.add(border);

    // Soil mound
    const mound = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.0, 0.14, 14),
      new THREE.MeshLambertMaterial({ color: 0x4e342e })
    );
    mound.position.set(x, 0.09, z);
    this.scene.add(mound);

    // Glowing interaction ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.05, 16),
      new THREE.MeshBasicMaterial({ color: 0x2ecc71, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.18, z);
    this.scene.add(ring);

    this.plantSpots.push({
      id,
      position: new THREE.Vector3(x, 0, z),
      mound,
      ring,
      isPlanted: false,
      isWatered: false,
      treeMesh: null
    });
  }

  // ═════════════════════════════════════════════════════
  // 9. Traditional Algerian Souk (السوق الشعبي المنظم)
  // ═════════════════════════════════════════════════════
  createSouk() {
    const sx = 21;
    const sz = 63;

    // Dedicated paved souk square
    const soukFloor = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.12, 16),
      new THREE.MeshLambertMaterial({ color: 0xd7ccc8 })
    );
    soukFloor.position.set(sx, 0.06, sz);
    soukFloor.receiveShadow = true;
    this.scene.add(soukFloor);

    // Ornate Moorish Entrance Archway (باب السوق الكبير - لا لافتات عائمة)
    const gatePillars = [-5.5, 5.5];
    gatePillars.forEach(gx => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.2, 1.2), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      p.position.set(sx + gx, 2.6, sz - 7.5);
      p.castShadow = true;
      this.scene.add(p);
    });

    // Arch beam connecting pillars
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.4, 1.4), new THREE.MeshLambertMaterial({ color: 0x6d4c41 }));
    archBeam.position.set(sx, 5.2, sz - 7.5);
    archBeam.castShadow = true;
    this.scene.add(archBeam);

    // Sign attached securely onto the wooden beam
    this.createMountedSign(sx, 5.2, sz - 6.75, '🛒 السوق الشعبي - خيرات بلادنا المباركة', 0xe67e22);

    // 6 Traditional Market Stalls (2 rows of 3)
    const canopyColors = [0xe74c3c, 0x27ae60, 0xf39c12, 0x3498db, 0x9b59b6, 0xe67e22];
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x795548 });

    const stallPos = [
      [-6, -3], [0, -3], [6, -3],
      [-6, 3],  [0, 3],  [6, 3]
    ];

    stallPos.forEach(([ox, oz], i) => {
      const posX = sx + ox;
      const posZ = sz + oz;

      // Wooden counter table
      const table = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.0, 1.6), woodMat);
      table.position.set(posX, 0.5, posZ);
      table.castShadow = true;
      this.scene.add(table);

      // Fruit/goods crates on counter
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), new THREE.MeshLambertMaterial({ color: 0xd35400 }));
      crate.position.set(posX - 0.6, 1.1, posZ);
      this.scene.add(crate);

      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xc0392b }));
      pot.position.set(posX + 0.6, 1.25, posZ);
      this.scene.add(pot);

      // 4 Corner Wooden Posts
      [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), woodMat);
        post.position.set(posX + px, 1.2, posZ + pz);
        this.scene.add(post);
      });

      // Striped Fabric Canopy Top
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 0.9, 4),
        new THREE.MeshLambertMaterial({ color: canopyColors[i] })
      );
      canopy.rotation.y = Math.PI / 4;
      canopy.position.set(posX, 2.7, posZ);
      canopy.castShadow = true;
      this.scene.add(canopy);

      this.collisionSystem.addBox(posX - 1.5, posZ - 0.9, posX + 1.5, posZ + 0.9, 3.2);
    });

    this.collisionSystem.addBox(sx - 6.5, sz - 8.5, sx + 6.5, sz - 6.5, 6);
  }

  // ═════════════════════════════════════════════════════
  // 10. Residential Quarters (الأحياء السكنية الجزائرية)
  // Set back safely from roads: No intersections with streets!
  // ═════════════════════════════════════════════════════
  createResidentialQuarter() {
    const buildings = [
      // Residential corner blocks (each block sits fully between the ring roads: |x|,|z| in [51, 75])
      // North-West
      { x: -69, z: -69, w: 9, h: 12, d: 8, color: 0xf5eedc },
      { x: -57, z: -69, w: 8, h: 10, d: 8, color: 0xe8d5b7 },
      { x: -63, z: -57, w: 10, h: 13, d: 8, color: 0xe0d6c8 },
      // North-East
      { x: 57,  z: -69, w: 9, h: 14, d: 8, color: 0xf5eedc },
      { x: 69,  z: -69, w: 8, h: 11, d: 8, color: 0xe8dfd8 },
      { x: 63,  z: -57, w: 10, h: 11, d: 8, color: 0xd8cbb5 },
      // South-West
      { x: -63, z: 57,  w: 10, h: 12, d: 8, color: 0xf5eedc },
      { x: -69, z: 69,  w: 9, h: 13, d: 8, color: 0xf5eedc },
      { x: -57, z: 69,  w: 8, h: 11, d: 8, color: 0xecd0b8 },
      // South-East
      { x: 63,  z: 57,  w: 10, h: 10, d: 8, color: 0xecd0b8 },
      { x: 57,  z: 69,  w: 9, h: 12, d: 8, color: 0xd8cbb5 },
      { x: 69,  z: 69,  w: 8, h: 10, d: 8, color: 0xf5eedc }
    ];

    buildings.forEach(b => {
      this.createResidentialBuilding(b.x, b.z, b.w, b.h, b.d, b.color);
    });
  }

  createResidentialBuilding(x, z, w, h, d, color) {
    const floors = Math.max(2, Math.min(4, Math.floor(h / 3.4)));
    this.buildings.createCartoonApartment(x, z, w, floors, d, color);
    this.collisionSystem.addBox(x - w / 2 - 0.3, z - d / 2 - 0.3, x + w / 2 + 0.3, z + d / 2 + 0.3, h + 1);
  }

  // ═════════════════════════════════════════════════════
  // 11. Street Furniture & Environment
  // ═════════════════════════════════════════════════════
  createStreetFurniture() {
    // Streetlamps positioned strictly along the curb edge (away from central pedestrian corridor)
    const lampPositions = [
      // East-West Main Avenue (curb line at z = 4.4 & -4.4, pedestrian corridor is at z = 6.8 & -6.8)
      [-18, 5], [18, 5], [-18, -5], [18, -5],
      [-34, 5], [34, 5], [-34, -5], [34, -5],
      // North-South Main Boulevard (curb line at x = 4.4 & -4.4, pedestrian corridor is at x = 6.8 & -6.8)
      [-5, -18], [5, -18], [-5, 18], [5, 18],
      [-5, -34], [5, -34], [-5, 34], [5, 34]
    ];

    lampPositions.forEach(([lx, lz]) => {
      this.createStreetLamp(lx, lz);
    });

    // Street Trees along main avenues (placed on outer sidewalk verge at z = 9.2 & -9.2)
    [-30, -22, 22, 30].forEach(tx => {
      this.createPalmTree(tx, 9.2);
      this.createPalmTree(tx, -9.2);
    });

    // Street Name Signs in Arabic (securely mounted on curb posts)
    this.createStreetSign(-14, 5.2, 'شارع أول نوفمبر 🇩🇿');
    this.createStreetSign(5.2, 14, 'نهج الشهداء 🇩🇿');
  }

  createStreetLamp(x, z) {
    const lamp = this.streetProps.createGlobeStreetLamp(x, z);
    this.streetLights.push(lamp.light);
    this.collisionSystem.addBox(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 6);
  }

  createStreetSign(x, z, text) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), new THREE.MeshLambertMaterial({ color: 0x636e72 }));
    pole.position.set(x, 1.4, z);
    this.scene.add(pole);

    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.08), new THREE.MeshLambertMaterial({ color: 0x0984e3 }));
    board.position.set(x, 2.7, z);
    this.scene.add(board);
  }

  createMountedSign(x, y, z, text, colorHex) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 1.1, 0.25),
      new THREE.MeshLambertMaterial({ color: colorHex })
    );
    board.position.set(x, y, z);
    this.scene.add(board);
  }

  createPalmTree(x, z) {
    this.nature.createAlgerianPalm(x, z);
    this.collisionSystem.addBox(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 7);
  }

  createBench(x, z, rotY = 0) {
    const wood = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const benchGroup = new THREE.Group();
    benchGroup.position.set(x, 0, z);
    benchGroup.rotation.y = rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.7), wood);
    seat.position.y = 0.45;
    seat.castShadow = true;
    benchGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.1), wood);
    backrest.position.set(0, 0.75, -0.3);
    benchGroup.add(backrest);

    this.scene.add(benchGroup);
    this.collisionSystem.addBox(x - 1.2, z - 0.5, x + 1.2, z + 0.5, 1.2);
  }

  createAlgerianFlag(x, y, z, poleHeight = 6) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, poleHeight, 8), new THREE.MeshLambertMaterial({ color: 0xdfe6e9 }));
    pole.position.set(x, y + poleHeight / 2, z);
    this.scene.add(pole);

    const flagGroup = new THREE.Group();
    flagGroup.position.set(x + 0.8, y + poleHeight - 0.6, z);

    const greenHalf = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshLambertMaterial({ color: 0x27ae60, side: THREE.DoubleSide }));
    greenHalf.position.set(-0.4, 0, 0);
    flagGroup.add(greenHalf);

    const whiteHalf = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    whiteHalf.position.set(0.4, 0, 0);
    flagGroup.add(whiteHalf);

    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 6, 12, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0xe74c3c }));
    crescent.position.set(0, 0, 0.01);
    crescent.rotation.z = Math.PI / 4;
    flagGroup.add(crescent);

    const star = new THREE.Mesh(new THREE.CircleGeometry(0.08, 5), new THREE.MeshBasicMaterial({ color: 0xe74c3c }));
    star.position.set(0.06, 0, 0.01);
    flagGroup.add(star);

    this.scene.add(flagGroup);
  }

  // ═════════════════════════════════════════════════════
  // 12. Showcase Section (المرحلة الأولى - النماذج السبعة الكرتونية الفاخرة)
  // ═════════════════════════════════════════════════════
  createShowcaseSection() {
    // 1. Featured Stylized Lavender Apartment Building (West promenade facade, set back generously)
    this.createVolunteerAssociation();

    // 2. Featured Algerian Bakery Shop ("مخبزة الأصالة الجزائرية" - spaced 14m north-to-south)
    this.buildings.createCartoonShop(-18, 27, 'bakery', Math.PI / 2);
    this.collisionSystem.addBox(-22.5, 22.5, -13.5, 31.5, 6);

    // (Parked taxi and bus removed: they sat in the driving lane and blocked traffic)

    // 5. Stylized Modern Bus Stop Shelter on the outer sidewalk verge
    this.streetProps.createBusStopShelter(-9.2, 21, Math.PI / 2);
    this.collisionSystem.addBox(-9.8, 19.5, -8.6, 22.5, 3);

    // 6. Stylized Cartoon Traffic Light at the curb corner
    this.streetProps.createTrafficLight(-4.6, 10.6, Math.PI);

    // 7. Eco Recycling Bins on the outer promenade edge
    this.streetProps.createEcoBins(-9.2, 17, Math.PI / 2);

    // 8. Fluffy Cloud-like Cartoon Trees & Potted Plants along the outer facade verge
    this.nature.createCartoonTree(-9.5, 8.0, 1.1, 'green');
    this.nature.createCartoonTree(9.5, 8.0, 1.1, 'light');
    this.nature.createPottedPlant(-9.2, 14.5, 1.1);
    this.nature.createPottedPlant(-9.2, 25.5, 1.1);

    // Fluffy trees bordering Central Park promenade
    this.nature.createCartoonTree(10.5, 12, 1.2, 'green');
    this.nature.createCartoonTree(10.5, 18, 1.1, 'light');
  }

  // ═════════════════════════════════════════════════════
  // 13. Police Station (مقر الأمن الوطني الجزائري)
  // ═════════════════════════════════════════════════════
  /**
   * Volunteer association HQ (مقر جمعية شباب التطوع): two storeys, green trim, faces the main avenue.
   * The Arabic entrance sign and the interior are added by InteriorSystem.
   */
  createVolunteerAssociation() {
    const cx = -21, cz = 15, w = 10, d = 7.5, h = 7;
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    this.scene.add(g);

    const wall = new THREE.MeshLambertMaterial({ color: 0xf3e3c3 });
    const trim = new THREE.MeshLambertMaterial({ color: 0x1e8449 });
    const glass = new THREE.MeshLambertMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.8 });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4b2a });
    const red = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };

    add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall), 0, h / 2, 0);
    add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2), trim), 0, 3.5, 0);
    add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3), trim), 0, h + 0.1, 0);

    const fz = -d / 2 - 0.06; // front facade (faces -z)
    add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.1), trim), 0, 1.45, fz + 0.02);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.12), wood), 0, 1.3, fz);
    add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.2), trim), 0, 2.95, fz - 0.55);
    [[-3.3, 1.7], [3.3, 1.7], [-3.3, 5.2], [3.3, 5.2]].forEach(([x, y]) => {
      add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.08), trim), x, y, fz + 0.02);
      add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.1), glass), x, y, fz);
    });

    // Heart logo (volunteering) above the entrance
    const heart = new THREE.Group();
    [-1, 1].forEach(s => {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), red);
      lobe.position.set(s * 0.24, 0.12, 0);
      heart.add(lobe);
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.75, 20), red);
    tip.rotation.z = Math.PI;
    tip.position.y = -0.3;
    heart.add(tip);
    heart.scale.z = 0.35;
    add(heart, 0, 5.2, fz - 0.1);

    // Donation boxes by the door
    [[-1.9, -d / 2 - 0.5], [1.9, -d / 2 - 0.5]].forEach(([x, z]) => {
      add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xc8a165 })), x, 0.45, z);
    });

    this.collisionSystem.addBox(cx - w / 2 - 0.2, cz - d / 2 - 0.2, cx + w / 2 + 0.2, cz + d / 2 + 0.2, h);
    this.collisionSystem.addBox(cx - 2.3, cz - d / 2 - 0.8, cx - 1.5, cz - d / 2 - 0.2, 1);
    this.collisionSystem.addBox(cx + 1.5, cz - d / 2 - 0.8, cx + 2.3, cz - d / 2 - 0.2, 1);
  }

  createPoliceStationBuilding() {
    const px = -21;
    const pz = 63;
    this.buildings.createPoliceStation(px, pz, Math.PI);
    this.collisionSystem.addBox(px - 8.5, pz - 7.5, px + 8.5, pz + 7.5, 12);

    // Parked Police Patrol Car in front forecourt
    this.vehicles.createPolicePatrolCar(px + 7.5, pz - 7.5, 0);
    this.collisionSystem.addBox(px + 6.2, pz - 9.5, px + 8.8, pz - 5.5, 2.5);

    // Algerian Flag at Police Station
    this.createAlgerianFlag(px - 6.5, 0.1, pz - 7.5, 6);
  }

  // ═════════════════════════════════════════════════════
  // 14. Civil Protection Station (مركز الحماية المدنية)
  // ═════════════════════════════════════════════════════
  createCivilProtectionStationBuilding() {
    const fx = -21;
    const fz = -63;
    this.buildings.createCivilProtectionStation(fx, fz, 0);
    this.collisionSystem.addBox(fx - 8.5, fz - 7.5, fx + 8.5, fz + 7.5, 14);

    // Parked Emergency Ambulance in bay
    this.vehicles.createCartoonCar(fx + 6.0, fz + 6.5, 0, 0xc0392b, false);
    this.collisionSystem.addBox(fx + 4.5, fz + 5.0, fx + 7.5, fz + 8.0, 2.5);
  }

  // ═════════════════════════════════════════════════════
  // 15. Municipality / Town Hall (مقر البلدية APC)
  // ═════════════════════════════════════════════════════
  createTownHallBuilding() {
    const tx = 21;
    const tz = -69;
    this.buildings.createTownHall(tx, tz, 0);
    this.collisionSystem.addBox(tx - 9.5, tz - 7.5, tx + 9.5, tz + 7.5, 15);

    // Twin Algerian Flags flanking the entrance
    this.createAlgerianFlag(tx - 7.5, 0.1, tz + 7.5, 6);
    this.createAlgerianFlag(tx + 7.5, 0.1, tz + 7.5, 6);
  }

  // ═════════════════════════════════════════════════════
  // 16. Casbah Traditional Heritage Quarter (حي القصبة العتيق)
  // ═════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════
  // Player's family home (south-east residential block) with courtyard and driveway
  // ═════════════════════════════════════════════════════
  createPlayerHome() {
    const H = this.playerHome = {
      house: { minX: 72.5, maxX: 80.5, minZ: 55, maxZ: 62, h: 4.2 },
      door: [75, 54.6],
      carSpot: { x: 70.45, z: 56.5, heading: Math.PI },
      driveway: { minX: 68.7, maxX: 72.2, minZ: 51, maxZ: 60.5 }
    };
    const b = H.house;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const w = b.maxX - b.minX, d = b.maxZ - b.minZ;
    const wallMat = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xf4ecdc, roughness: 0.9 }), 0.05);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd8c3a0, roughness: 0.8 });
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x2e86c1, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x23394d, roughness: 0.1, metalness: 0.1 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e6b4a, roughness: 0.55 });
    const paveMat = addSurfaceDetail(new THREE.MeshStandardMaterial({ color: 0xcbbfae, roughness: 0.85 }), 0.06, 0.8);
    const add = (mesh, x, y, z, shadow = true) => { mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; this.scene.add(mesh); return mesh; };

    // Paved courtyard in front of the house and the driveway (flush with the sidewalk: walkable and drivable)
    const dw = H.driveway;
    add(new THREE.Mesh(new RoundedBoxGeometry(dw.maxX - dw.minX, 0.2, dw.maxZ - dw.minZ, 2, 0.04), paveMat), (dw.minX + dw.maxX) / 2, 0.1, (dw.minZ + dw.maxZ) / 2, false);
    add(new THREE.Mesh(new RoundedBoxGeometry(80.5 - dw.maxX, 0.2, b.minZ - 51, 2, 0.04), paveMat), (dw.maxX + 80.5) / 2, 0.1, (51 + b.minZ) / 2, false);

    // House body on a stone plinth, with a smaller upper room and a roof-terrace parapet
    add(new THREE.Mesh(new RoundedBoxGeometry(w + 0.3, 0.45, d + 0.3, 2, 0.06), trimMat), cx, 0.225, cz);
    add(new THREE.Mesh(new RoundedBoxGeometry(w, b.h, d, 3, 0.12), wallMat), cx, b.h / 2, cz);
    add(new THREE.Mesh(new RoundedBoxGeometry(w + 0.2, 0.2, d + 0.2, 2, 0.06), trimMat), cx, b.h + 0.1, cz);
    const upper = { minX: 76.2, maxX: 80.3, minZ: 57.6, maxZ: 61.8 };
    add(new THREE.Mesh(new RoundedBoxGeometry(upper.maxX - upper.minX, 2.8, upper.maxZ - upper.minZ, 3, 0.1), wallMat), (upper.minX + upper.maxX) / 2, b.h + 1.6, (upper.minZ + upper.maxZ) / 2);
    add(new THREE.Mesh(new RoundedBoxGeometry(upper.maxX - upper.minX + 0.2, 0.18, upper.maxZ - upper.minZ + 0.2, 2, 0.05), trimMat), (upper.minX + upper.maxX) / 2, b.h + 3.1, (upper.minZ + upper.maxZ) / 2);
    // Parapet along the open terrace edges (front and left)
    add(new THREE.Mesh(new RoundedBoxGeometry(upper.minX - b.minX, 0.7, 0.18, 2, 0.05), wallMat), (b.minX + upper.minX) / 2, b.h + 0.55, b.minZ + 0.1);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.7, d, 2, 0.05), wallMat), b.minX + 0.1, b.h + 0.55, cz);
    add(new THREE.Mesh(new RoundedBoxGeometry(b.maxX - upper.minX, 0.7, 0.18, 2, 0.05), wallMat), (upper.minX + b.maxX) / 2, b.h + 0.55, b.minZ + 0.1);

    // Arched green front door with a stone frame
    const [doorX] = H.door;
    add(new THREE.Mesh(new RoundedBoxGeometry(1.7, 2.75, 0.2, 2, 0.06), trimMat), doorX, 1.6, b.minZ - 0.04);
    add(new THREE.Mesh(new RoundedBoxGeometry(1.25, 2.3, 0.1, 2, 0.04), doorMat), doorX, 1.6, b.minZ - 0.12);
    const arch = add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24, 1, false, -Math.PI / 2, Math.PI), doorMat), doorX, 2.75, b.minZ - 0.12);
    arch.rotation.x = -Math.PI / 2; // upper half-disc
    add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 })), doorX + 0.42, 1.55, b.minZ - 0.2, false);
    // Step in front of the door
    add(new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.12, 0.6, 2, 0.04), trimMat), doorX, 0.26, b.minZ - 0.3, false);

    // Windows with blue shutters (front and side)
    const windowAt = (x, y, z, rotY) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      const frame = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.2, 0.12, 2, 0.04), trimMat);
      g.add(frame);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.95), glassMat);
      pane.position.z = 0.07;
      g.add(pane);
      [-1, 1].forEach(s => {
        const sh = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.1, 0.06, 2, 0.02), shutterMat);
        sh.position.set(s * 0.95, 0, 0.08);
        sh.rotation.y = s * 0.35;
        g.add(sh);
      });
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      this.scene.add(g);
    };
    windowAt(78.2, 2.1, b.minZ - 0.04, Math.PI);
    windowAt(73.4, 2.1, b.minZ - 0.04, Math.PI);
    windowAt(b.minX - 0.04, 2.1, 59.5, -Math.PI / 2);
    windowAt(78.25, b.h + 1.6, upper.minZ - 0.04, Math.PI);

    // Potted plants either side of the door and a small garden bed
    this.nature.createPottedPlant(doorX - 1.4, b.minZ - 0.7, 0.9);
    this.nature.createPottedPlant(doorX + 1.4, b.minZ - 0.7, 0.9);
    this.nature.createCartoonBush(79.6, 52.2, 0.7, 'green');

    // Solid house (door is used through the interior system), plants
    this.collisionSystem.addBox(b.minX - 0.15, b.minZ - 0.15, b.maxX + 0.15, b.maxZ + 0.15, b.h + 3.2);
    [doorX - 1.4, doorX + 1.4].forEach(px => this.collisionSystem.addBox(px - 0.35, b.minZ - 1.05, px + 0.35, b.minZ - 0.35, 1.2));
    this.collisionSystem.addBox(79.0, 51.6, 80.2, 52.8, 1.2);
  }

  createCasbahHeritageQuarter() {
    const cx = 63;
    const cz = 21;
    this.buildings.createCasbahHeritage(cx, cz, -Math.PI / 2);
    this.collisionSystem.addBox(cx - 7.5, cz - 6.5, cx + 7.5, cz + 6.5, 10);

    // Decorative Casbah street palm
    this.nature.createAlgerianPalm(cx - 5.5, cz - 6.5);
    this.collisionSystem.addBox(cx - 6.0, cz - 7.0, cx - 5.0, cz - 6.0, 6);
  }

  update(dt, elapsed) {
    // Animate procedural cartoon clouds and blimp
    if (this.sky) {
      this.sky.update(dt, elapsed);
    }

    // Animate fountain water
    this.fountains.forEach(f => {
      f.waterMesh.rotation.y += dt * 0.4;
      f.waterMesh.position.y = 0.60 + Math.sin(elapsed * 3) * 0.025;
    });

    this.waterMeshes.forEach(w => {
      w.rotation.y += dt * 0.3;
    });

    // Animate plant spot rings
    this.plantSpots.forEach((spot, i) => {
      if (!spot.isPlanted) {
        spot.ring.scale.setScalar(1 + Math.sin(elapsed * 4 + i) * 0.1);
      }
    });
  }
}
