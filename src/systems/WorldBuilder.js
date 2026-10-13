import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CartoonSkySystem } from './visuals/CartoonSkySystem.js';
import { CartoonNatureGenerator } from './visuals/CartoonNatureGenerator.js';
import { CartoonVehicleGenerator } from './visuals/CartoonVehicleGenerator.js';
import { CartoonStreetPropsGenerator } from './visuals/CartoonStreetPropsGenerator.js';
import { CartoonBuildingGenerator } from './visuals/CartoonBuildingGenerator.js';

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
  }

  // ═════════════════════════════════════════════════════
  // 1. Ground & Road Network (Grid & Parcels)
  // ═════════════════════════════════════════════════════
  createGroundAndRoads() {
    // City base terrain (Lush Algerian Mediterranean grass)
    // Subdivided terrain with soft, low-frequency grass colour variation (no flat single tone)
    const groundGeo = new THREE.PlaneGeometry(180, 180, 90, 90);
    const gPos = groundGeo.attributes.position;
    const gCol = new Float32Array(gPos.count * 3);
    const lush = new THREE.Color(0x4f8a3a);
    const dry = new THREE.Color(0x7d8f45);
    const deep = new THREE.Color(0x3e7433);
    const tmp = new THREE.Color();
    for (let i = 0; i < gPos.count; i++) {
      const gx = gPos.getX(i);
      const gy = gPos.getY(i);
      const n1 = Math.sin(gx * 0.07) * Math.cos(gy * 0.09) * 0.5 + 0.5;
      const n2 = Math.sin(gx * 0.23 + 1.7) * Math.sin(gy * 0.19 + 0.4) * 0.5 + 0.5;
      tmp.copy(lush).lerp(dry, n1 * 0.55).lerp(deep, n2 * 0.35);
      gCol[i * 3] = tmp.r; gCol[i * 3 + 1] = tmp.g; gCol[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Main Avenue East-West (شارع أول نوفمبر) - Corridor z: [-6.5, 6.5]
    this.createRoadSegment(0, 0, 160, 8, true);

    // Main Boulevard North-South (نهج الشهداء) - Corridor x: [-6.5, 6.5]
    this.createRoadSegment(0, 0, 8, 160, false);

    // Secondary Northern East-West Road (z = -42)
    this.createRoadSegment(0, -42, 150, 7, true);

    // Secondary Southern East-West Road (z = 42)
    this.createRoadSegment(0, 42, 150, 7, true);

    // Secondary Western North-South Road (x = -42)
    this.createRoadSegment(-42, 0, 7, 150, false);

    // Secondary Eastern North-South Road (x = 42)
    this.createRoadSegment(42, 0, 7, 150, false);
  }

  createRoadSegment(cx, cz, w, d, isHorizontal) {
    // Shared materials; ground-layer decals use polygonOffset instead of tiny height gaps (no flicker)
    const decal = (color, layer) => new THREE.MeshStandardMaterial({
      color, roughness: 0.75, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -layer, polygonOffsetUnits: -layer * 2
    });
    this.roadMats = this.roadMats || {
      road: new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.92, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
      line: decal(0xe8b923, 2),
      stripe: decal(0xf2f2ee, 3),
      curb: new THREE.MeshStandardMaterial({ color: 0xc2b9a9, roughness: 0.88, metalness: 0 })
    };
    const roadMat = this.roadMats.road;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(cx, 0.01, cz);
    road.receiveShadow = true;
    this.scene.add(road);

    const lineMat = this.roadMats.line;
    const curbMat = this.roadMats.curb;
    const sidewalkWidth = 5.5; // Grand spacious 5.5m wide pedestrian sidewalk

    if (isHorizontal) {
      // Yellow dashed lane divider
      for (let x = -w / 2 + 5; x < w / 2 - 5; x += 6) {
        // Skip roundabout center
        if (Math.abs(cx + x) < 14 && Math.abs(cz) < 14) continue;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.3), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(cx + x, 0.02, cz);
        dash.receiveShadow = true;
        this.scene.add(dash);
      }
      // Sidewalks on both sides (each 5.5m wide, providing luxurious promenade space)
      this.createSidewalk(cx, cz - d / 2 - sidewalkWidth / 2, w, sidewalkWidth, curbMat);
      this.createSidewalk(cx, cz + d / 2 + sidewalkWidth / 2, w, sidewalkWidth, curbMat);
      // Wide Crosswalks at avenue crossings
      this.createCrosswalk(16, cz, isHorizontal);
      this.createCrosswalk(-16, cz, isHorizontal);
    } else {
      for (let z = -d / 2 + 5; z < d / 2 - 5; z += 6) {
        if (Math.abs(cz + z) < 14 && Math.abs(cx) < 14) continue;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3.2), lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(cx, 0.02, cz + z);
        dash.receiveShadow = true;
        this.scene.add(dash);
      }
      // Sidewalks on both sides
      this.createSidewalk(cx - w / 2 - sidewalkWidth / 2, cz, sidewalkWidth, d, curbMat);
      this.createSidewalk(cx + w / 2 + sidewalkWidth / 2, cz, sidewalkWidth, d, curbMat);
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
    const px = 0;
    const pz = 0;

    // Tiled Sandstone Circular Plaza
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(13.5, 13.5, 0.12, 32),
      new THREE.MeshLambertMaterial({ color: 0xd2c4a8 })
    );
    plaza.position.set(px, 0.06, pz);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Inner Geometric Ring Pattern
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(6, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xd4c2a5, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(px, 0.13, pz);
    innerRing.receiveShadow = true;
    this.scene.add(innerRing);

    // Monument Grand Stepped Marble Base
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 0.4, 16), new THREE.MeshLambertMaterial({ color: 0xf5f6fa }));
    step1.position.set(px, 0.26, pz);
    step1.castShadow = true;
    this.scene.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.8, 16), new THREE.MeshLambertMaterial({ color: 0xecf0f1 }));
    step2.position.set(px, 0.8, pz);
    step2.castShadow = true;
    this.scene.add(step2);

    // Main Martyr Memorial Column (مقام الشهيد / مسلة التحرير)
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7.8, 10), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    pillar.position.set(px, 5.0, pz);
    pillar.castShadow = true;
    this.scene.add(pillar);

    // Golden Crescent & Star Top Finial
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 16, Math.PI * 1.5), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
    crescent.position.set(px, 9.4, pz);
    crescent.rotation.y = Math.PI / 4;
    this.scene.add(crescent);

    const star = new THREE.Mesh(new THREE.CircleGeometry(0.24, 5), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
    star.position.set(px + 0.18, 9.4, pz);
    star.rotation.y = Math.PI / 4;
    this.scene.add(star);

    // Stylized Wrought-Iron Railing Square Enclosure (just like City Island 5 reference)
    const railW = 8.5;
    this.streetProps.createDecorativeRailing(px, pz - railW / 2, railW, 0);
    this.streetProps.createDecorativeRailing(px, pz + railW / 2, railW, 0);
    this.streetProps.createDecorativeRailing(px - railW / 2, pz, railW, Math.PI / 2);
    this.streetProps.createDecorativeRailing(px + railW / 2, pz, railW, Math.PI / 2);

    // Stylized Autumn Golden & Cyan Flowering Bushes inside the garden square
    this.nature.createCartoonBush(px - 2.4, pz - 2.4, 0.9, 'autumn');
    this.nature.createCartoonBush(px + 2.4, pz - 2.4, 0.9, 'cyan');
    this.nature.createCartoonBush(px - 2.4, pz + 2.4, 0.9, 'cyan');
    this.nature.createCartoonBush(px + 2.4, pz + 2.4, 0.9, 'autumn');
    this.nature.createCartoonBush(px, pz - 3.0, 0.8, 'green');
    this.nature.createCartoonBush(px, pz + 3.0, 0.8, 'green');

    // 4 Corner Globe Lanterns around the plaza garden
    const corners = [
      [-railW / 2 - 0.3, -railW / 2 - 0.3],
      [railW / 2 + 0.3, -railW / 2 - 0.3],
      [-railW / 2 - 0.3, railW / 2 + 0.3],
      [railW / 2 + 0.3, railW / 2 + 0.3]
    ];
    corners.forEach(([cx, cz]) => {
      const lamp = this.streetProps.createGlobeStreetLamp(px + cx, pz + cz, 0.85);
      this.streetLights.push(lamp.light);
    });

    // 4 Plaza Benches in Diagonal Corners
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    angles.forEach(ang => {
      const bx = px + Math.cos(ang) * 9.8;
      const bz = pz + Math.sin(ang) * 9.8;
      this.createBench(bx, bz, ang + Math.PI / 2);
    });

    this.collisionSystem.addBox(px - 4.4, pz - 4.4, px + 4.4, pz + 4.4, 10);
  }

  // ═════════════════════════════════════════════════════
  // 3. The Great Algerian Mosque (المسجد الكبير)
  // ═════════════════════════════════════════════════════
  createMosque() {
    const mx = -38;
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
    const mx = 34;
    const mz = -22;

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
    const sx = -36;
    const sz = -20;

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
    const hx = 16;
    const hz = -22;

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
    const px = 22;
    const pz = 16;

    // Lush green park grass lawn
    const parkGround = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.12, 18),
      new THREE.MeshLambertMaterial({ color: 0x388e3c })
    );
    parkGround.position.set(px, 0.06, pz);
    parkGround.receiveShadow = true;
    this.scene.add(parkGround);

    // Stone Walkway Path through park
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 18),
      new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
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
    const sx = 20;
    const sz = 40;

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
      // North-West Block (Safe distance from roads, well spaced apart)
      { x: -54, z: -18, w: 9, h: 12, d: 8, color: 0xf5eedc },
      { x: -54, z: -32, w: 8, h: 10, d: 8, color: 0xe8d5b7 },

      // South-West Block
      { x: -54, z: 18,  w: 9, h: 13, d: 8, color: 0xf5eedc },
      { x: -54, z: 32,  w: 8, h: 11, d: 8, color: 0xecd0b8 },

      // North-East Block
      { x: 54,  z: -18, w: 9, h: 14, d: 8, color: 0xf5eedc },
      { x: 54,  z: -32, w: 8, h: 11, d: 8, color: 0xe8dfd8 },

      // South-East Block
      { x: 54,  z: 18,  w: 9, h: 12, d: 8, color: 0xd8cbb5 },
      { x: 54,  z: 32,  w: 8, h: 10, d: 8, color: 0xf5eedc },

      // North Avenue Facades (Outer perimeter - completely clear of Town Hall at x: 0, z: -52)
      { x: -24, z: -56, w: 10, h: 12, d: 8, color: 0xe0d6c8 },
      { x: 24,  z: -56, w: 10, h: 11, d: 8, color: 0xd8cbb5 },

      // South Avenue Facades (Outer perimeter)
      { x: -24, z: 56, w: 10, h: 12, d: 8, color: 0xf5eedc },
      { x: 24,  z: 56, w: 10, h: 10, d: 8, color: 0xecd0b8 }
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
      [-18, 4.4], [18, 4.4], [-18, -4.4], [18, -4.4],
      [-34, 4.4], [34, 4.4], [-34, -4.4], [34, -4.4],
      // North-South Main Boulevard (curb line at x = 4.4 & -4.4, pedestrian corridor is at x = 6.8 & -6.8)
      [-4.4, -18], [4.4, -18], [-4.4, 18], [4.4, 18],
      [-4.4, -34], [4.4, -34], [-4.4, 34], [4.4, 34]
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
    this.createStreetSign(-14, 4.4, 'شارع أول نوفمبر 🇩🇿');
    this.createStreetSign(4.4, 14, 'نهج الشهداء 🇩🇿');
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
    this.buildings.createCartoonApartment(-18, 13, 9, 3, 8, 0x6c5ce7, Math.PI / 2);
    this.collisionSystem.addBox(-22.5, 8.5, -13.5, 17.5, 12);

    // 2. Featured Algerian Bakery Shop ("مخبزة الأصالة الجزائرية" - spaced 14m north-to-south)
    this.buildings.createCartoonShop(-18, 27, 'bakery', Math.PI / 2);
    this.collisionSystem.addBox(-22.5, 22.5, -13.5, 31.5, 6);

    // 3. Stylized Algerian Yellow Taxi parked neatly along the street asphalt curb (leaving sidewalk completely open)
    this.vehicles.createCartoonCar(-3.4, 11, 0, 0xf1c40f, true);
    this.collisionSystem.addBox(-4.2, 9.5, -2.6, 12.5, 2);

    // 4. Stylized Green & White City Bus at the dedicated asphalt bus bay
    this.vehicles.createCartoonBus(-3.4, 21, 0);
    this.collisionSystem.addBox(-4.4, 18.0, -2.4, 24.0, 3.5);

    // 5. Stylized Modern Bus Stop Shelter on the outer sidewalk verge
    this.streetProps.createBusStopShelter(-9.2, 21, Math.PI / 2);
    this.collisionSystem.addBox(-9.8, 19.5, -8.6, 22.5, 3);

    // 6. Stylized Cartoon Traffic Light at the curb corner
    this.streetProps.createTrafficLight(-4.4, 5.2, Math.PI);

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
  createPoliceStationBuilding() {
    const px = -28;
    const pz = 48;
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
    const fx = -28;
    const fz = -48;
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
    const tx = 0;
    const tz = -52;
    this.buildings.createTownHall(tx, tz, 0);
    this.collisionSystem.addBox(tx - 9.5, tz - 7.5, tx + 9.5, tz + 7.5, 15);

    // Twin Algerian Flags flanking the entrance
    this.createAlgerianFlag(tx - 7.5, 0.1, tz + 7.5, 6);
    this.createAlgerianFlag(tx + 7.5, 0.1, tz + 7.5, 6);
  }

  // ═════════════════════════════════════════════════════
  // 16. Casbah Traditional Heritage Quarter (حي القصبة العتيق)
  // ═════════════════════════════════════════════════════
  createCasbahHeritageQuarter() {
    const cx = 40;
    const cz = 22;
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
