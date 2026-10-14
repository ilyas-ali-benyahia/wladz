import * as THREE from 'three';

/**
 * CartoonStreetPropsGenerator: Creates stylized street furniture,
 * decorative iron railings, globe lanterns, traffic lights, bus shelters,
 * and clean recycling bins inspired by the City Island reference.
 */
export class CartoonStreetPropsGenerator {
  constructor(scene) {
    this.scene = scene;
    this.initMaterials();
  }

  initMaterials() {
    this.ironMat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    this.woodMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    this.glassMat = new THREE.MeshLambertMaterial({ color: 0x81ecec, transparent: true, opacity: 0.75 });
    this.lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    this.redLightMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    this.yellowLightMat = new THREE.MeshBasicMaterial({ color: 0xffa502 });
    this.greenLightMat = new THREE.MeshBasicMaterial({ color: 0x2ed573 });
    this.binGreenMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
    this.binBlueMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
    this.signMat = new THREE.MeshLambertMaterial({ color: 0x0984e3 });
  }

  /**
   * Vintage / Modern Globe Street Lamp (like in City Island 5 roundabout)
   */
  createGlobeStreetLamp(x, z, scale = 1.0) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);

    // Flared cast-iron base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32 * scale, 0.48 * scale, 0.5 * scale, 12),
      this.ironMat
    );
    base.position.y = 0.25 * scale;
    base.castShadow = true;
    lampGroup.add(base);

    // Slim tapered pole with decorative rings
    const poleH = 4.8 * scale;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, poleH, 10),
      this.ironMat
    );
    pole.position.y = poleH / 2;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Mid collar ring
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.16 * scale, 0.04 * scale, 6, 12),
      this.ironMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = poleH * 0.65;
    lampGroup.add(collar);

    // Curved Top Bracket & Globe Lantern
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 * scale, 0.12 * scale, 0.3 * scale, 10),
      this.ironMat
    );
    bracket.position.y = poleH + 0.15 * scale;
    lampGroup.add(bracket);

    // Glowing round spherical globe
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.38 * scale, 16, 14),
      this.lampGlowMat
    );
    globe.position.y = poleH + 0.48 * scale;
    lampGroup.add(globe);

    // Warm point light
    const pLight = new THREE.PointLight(0xfff388, 0.85, 15);
    pLight.position.y = poleH + 0.48 * scale;
    lampGroup.add(pLight);

    this.scene.add(lampGroup);
    return { group: lampGroup, light: pLight };
  }

  /**
   * Stylized Cartoon Traffic Light
   */
  createTrafficLight(x, z, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 4.8, 8),
      this.ironMat
    );
    pole.position.y = 2.4;
    pole.castShadow = true;
    group.add(pole);

    // Signal Box with curved edges
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.4, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x34495e })
    );
    box.position.set(0, 4.4, 0);
    box.castShadow = true;
    group.add(box);

    // 3 Circular Lights with sun visors
    const lights = [
      { mat: this.redLightMat, y: 4.8 },
      { mat: this.yellowLightMat, y: 4.4 },
      { mat: this.greenLightMat, y: 4.0 }
    ];

    lights.forEach(l => {
      const circle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
        l.mat
      );
      circle.rotation.x = Math.PI / 2;
      circle.position.set(0, l.y, 0.2);
      group.add(circle);

      // Cartoon hood / visor over the light
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 10, 1, true, 0, Math.PI),
        this.ironMat
      );
      visor.rotation.z = Math.PI;
      visor.position.set(0, l.y + 0.08, 0.22);
      group.add(visor);
    });

    this.scene.add(group);
    return group;
  }

  /**
   * Stylized Modern Bus Stop Shelter
   */
  createBusStopShelter(x, z, rotY = 0) {
    const shelter = new THREE.Group();
    shelter.position.set(x, 0, z);
    shelter.rotation.y = rotY;

    // 4 Steel Support Posts
    [[-1.8, -0.6], [1.8, -0.6], [-1.8, 0.6], [1.8, 0.6]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8),
        this.ironMat
      );
      post.position.set(px, 1.4, pz);
      shelter.add(post);
    });

    // Curved Tinted Glass Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.12, 1.8),
      new THREE.MeshLambertMaterial({ color: 0x0984e3 })
    );
    roof.position.set(0, 2.85, 0);
    shelter.add(roof);

    // Rear Glass Wall
    const backGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.2),
      this.glassMat
    );
    backGlass.position.set(0, 1.3, -0.58);
    shelter.add(backGlass);

    // Wooden Waiting Bench inside
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.1, 0.45),
      this.woodMat
    );
    bench.position.set(0, 0.55, -0.2);
    shelter.add(bench);

    // Information Display Poster / Map
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1.2),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    poster.position.set(1.1, 1.4, -0.56);
    shelter.add(poster);

    this.scene.add(shelter);
    return shelter;
  }

  /**
   * Eco Recycling Bins (Green & Blue pair)
   */
  createEcoBins(x, z, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Green Bin (Organic / General)
    const bin1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.85, 0.45),
      this.binGreenMat
    );
    bin1.position.set(-0.35, 0.45, 0);
    bin1.castShadow = true;
    group.add(bin1);

    // Blue Bin (Paper / Plastic)
    const bin2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.85, 0.45),
      this.binBlueMat
    );
    bin2.position.set(0.35, 0.45, 0);
    bin2.castShadow = true;
    group.add(bin2);

    // Curved Flip Lids
    [-0.35, 0.35].forEach((bx, idx) => {
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.56, 10, 1, false, 0, Math.PI),
        idx === 0 ? this.binGreenMat : this.binBlueMat
      );
      lid.rotation.z = Math.PI / 2;
      lid.position.set(bx, 0.9, 0);
      group.add(lid);
    });

    this.scene.add(group);
    return group;
  }

  /**
   * Decorative Plaza / Garden Wrought-Iron Railing
   */
  createDecorativeRailing(x, z, width = 6.0, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Top & Bottom Horizontal Iron Bars
    const barTop = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.06, 0.06),
      this.ironMat
    );
    barTop.position.y = 0.85;
    group.add(barTop);

    const barBot = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.06, 0.06),
      this.ironMat
    );
    barBot.position.y = 0.15;
    group.add(barBot);

    // Vertical ornate pickets with fleur-de-lis / spear tips
    const step = 0.45;
    for (let bx = -width / 2 + step / 2; bx < width / 2; bx += step) {
      const picket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6),
        this.ironMat
      );
      picket.position.set(bx, 0.5, 0);
      group.add(picket);

      // Diamond or Spear finial tip
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.12, 4),
        this.ironMat
      );
      tip.position.set(bx, 0.92, 0);
      group.add(tip);
    }

    this.scene.add(group);
    return group;
  }
}
