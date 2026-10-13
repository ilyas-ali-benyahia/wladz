import * as THREE from 'three';

/**
 * CartoonVehicleGenerator: Creates Stylized Cartoon 3D Vehicles
 * inspired by City Island 5: Compact Car, Algerian Taxi, Delivery Van, City Bus.
 * Cute, rounded, chunky cartoon proportions!
 */
export class CartoonVehicleGenerator {
  constructor(scene) {
    this.scene = scene;
    this.initMaterials();
  }

  initMaterials() {
    this.tireMat = new THREE.MeshLambertMaterial({ color: 0x1e272e });
    this.rimMat = new THREE.MeshLambertMaterial({ color: 0xdfe6e9 });
    this.glassMat = new THREE.MeshLambertMaterial({ color: 0x81ecec, transparent: true, opacity: 0.85 });
    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    this.chromeMat = new THREE.MeshLambertMaterial({ color: 0xf5f6fa });
    this.blackMat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
  }

  /**
   * Helper to create a stylized cartoon wheel
   */
  createWheel(scale = 1.0) {
    const wheelGroup = new THREE.Group();

    // Chunky rubber tire (torus or rounded cylinder)
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * scale, 0.38 * scale, 0.28 * scale, 14),
      this.tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Silver rim hubcap
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 0.29 * scale, 10),
      this.rimMat
    );
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Center lug cap
    const lug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.31 * scale, 6),
      this.blackMat
    );
    lug.rotation.z = Math.PI / 2;
    wheelGroup.add(lug);

    return wheelGroup;
  }

  /**
   * Compact Stylized Cartoon Car (or Algerian Taxi)
   */
  createCartoonCar(x, z, rotY = 0, colorHex = 0xf1c40f, isTaxi = false) {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = rotY;

    const bodyMat = new THREE.MeshLambertMaterial({ color: colorHex });

    // 1. Lower Chassis & Body
    const lowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.65, 4.0),
      bodyMat
    );
    lowerBody.position.y = 0.68;
    lowerBody.castShadow = true;
    carGroup.add(lowerBody);

    // Front Hood curve / bevel
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(2.08, 0.25, 1.2),
      bodyMat
    );
    hood.position.set(0, 0.95, 1.1);
    hood.rotation.x = 0.12;
    carGroup.add(hood);

    // 2. Cabin / Roof (Chubby cartoon greenhouse)
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.85, 2.2),
      bodyMat
    );
    cabin.position.set(0, 1.35, -0.3);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // 3. Stylized Curved Windshield & Windows
    // Front Windshield
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.75),
      this.glassMat
    );
    windshield.position.set(0, 1.35, 0.82);
    windshield.rotation.x = -0.32;
    carGroup.add(windshield);

    // Rear Window
    const rearWin = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.65),
      this.glassMat
    );
    rearWin.position.set(0, 1.35, -1.42);
    rearWin.rotation.x = Math.PI + 0.28;
    carGroup.add(rearWin);

    // Side Windows
    [-0.94, 0.94].forEach(sx => {
      const sideWin = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 0.65),
        this.glassMat
      );
      sideWin.position.set(sx, 1.35, -0.3);
      sideWin.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      carGroup.add(sideWin);
    });

    // 4. Front Grill & Bumpers
    const bumperF = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.25, 0.28),
      this.chromeMat
    );
    bumperF.position.set(0, 0.48, 2.05);
    carGroup.add(bumperF);

    const bumperR = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.25, 0.28),
      this.chromeMat
    );
    bumperR.position.set(0, 0.48, -2.05);
    carGroup.add(bumperR);

    // Front Headlights (Round, glowing cartoon eyes)
    [-0.75, 0.75].forEach(hx => {
      const light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12),
        this.headlightMat
      );
      light.rotation.x = Math.PI / 2;
      light.position.set(hx, 0.75, 2.02);
      carGroup.add(light);
    });

    // Rear Taillights
    [-0.75, 0.75].forEach(rx => {
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.18, 0.08),
        this.taillightMat
      );
      light.position.set(rx, 0.75, -2.02);
      carGroup.add(light);
    });

    // 5. Four Chunky Cartoon Wheels
    const wheelPositions = [
      [-1.08, 0.38, 1.25],
      [1.08, 0.38, 1.25],
      [-1.08, 0.38, -1.25],
      [1.08, 0.38, -1.25]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = this.createWheel(1.0);
      wheel.position.set(wx, wy, wz);
      carGroup.add(wheel);

      // Wheel well cutout / fender trim
      const fender = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.06, 6, 12, Math.PI),
        this.blackMat
      );
      fender.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
      fender.position.set(wx > 0 ? wx - 0.02 : wx + 0.02, wy, wz);
      carGroup.add(fender);
    });

    // 6. Taxi Accents if isTaxi
    if (isTaxi) {
      // Checker Stripe along sides
      [-1.06, 1.06].forEach(sx => {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(3.6, 0.14),
          new THREE.MeshBasicMaterial({ color: 0x2c3e50 })
        );
        stripe.position.set(sx, 0.75, 0);
        stripe.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        carGroup.add(stripe);
      });

      // Roof 3D TAXI Sign
      const signBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.22, 0.4),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      signBase.position.set(0, 1.88, -0.3);
      carGroup.add(signBase);

      const signCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.16, 0.28),
        new THREE.MeshBasicMaterial({ color: 0xf39c12 })
      );
      signCap.position.set(0, 2.02, -0.3);
      carGroup.add(signCap);
    }

    this.scene.add(carGroup);
    return carGroup;
  }

  /**
   * Stylized City Bus (Green & White like in reference image)
   */
  createCartoonBus(x, z, rotY = 0) {
    const busGroup = new THREE.Group();
    busGroup.position.set(x, 0, z);
    busGroup.rotation.y = rotY;

    const greenMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Lower Green Body
    const lowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.2, 7.8),
      greenMat
    );
    lowerBody.position.y = 1.0;
    lowerBody.castShadow = true;
    busGroup.add(lowerBody);

    // Upper White Body with Windows
    const upperBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.55, 1.2, 7.7),
      whiteMat
    );
    upperBody.position.y = 2.15;
    upperBody.castShadow = true;
    busGroup.add(upperBody);

    // Front Windshield
    const frontGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.95),
      this.glassMat
    );
    frontGlass.position.set(0, 2.15, 3.87);
    busGroup.add(frontGlass);

    // Front Route Destination Display (ETUSA / الجزائر العاصمة)
    const destBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.35, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x1e272e })
    );
    destBoard.position.set(0, 2.75, 3.86);
    busGroup.add(destBoard);

    // Long Side Windows
    [-1.29, 1.29].forEach(sx => {
      for (let w = -2.6; w <= 2.6; w += 1.3) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(1.0, 0.8),
          this.glassMat
        );
        win.position.set(sx, 2.15, w);
        win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        busGroup.add(win);
      }
    });

    // 6 Big Chunky Bus Wheels
    const busWheelPos = [
      [-1.34, 0.45, 2.4],
      [1.34, 0.45, 2.4],
      [-1.34, 0.45, -1.6],
      [1.34, 0.45, -1.6],
      [-1.34, 0.45, -2.8],
      [1.34, 0.45, -2.8]
    ];

    busWheelPos.forEach(([wx, wy, wz]) => {
      const wheel = this.createWheel(1.2);
      wheel.position.set(wx, wy, wz);
      busGroup.add(wheel);
    });

    // Headlights
    [-0.9, 0.9].forEach(hx => {
      const hl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12),
        this.headlightMat
      );
      hl.rotation.x = Math.PI / 2;
      hl.position.set(hx, 0.9, 3.92);
      busGroup.add(hl);
    });

    this.scene.add(busGroup);
    return busGroup;
  }

  /**
   * Algerian National Police Patrol Car (سيارة دورية الأمن الوطني 🇩🇿)
   */
  createPolicePatrolCar(x, z, rotY = 0) {
    const policeCar = this.createCartoonCar(x, z, rotY, 0xffffff, false);

    const blueMat = new THREE.MeshLambertMaterial({ color: 0x1b3b6f });
    const lightbarBlue = new THREE.MeshBasicMaterial({ color: 0x0984e3 });
    const lightbarRed = new THREE.MeshBasicMaterial({ color: 0xff4757 });

    // Blue National Police Stripe along both flanks
    [-1.06, 1.06].forEach(sx => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.28), blueMat);
      stripe.position.set(sx, 0.72, 0);
      stripe.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      policeCar.add(stripe);
    });

    // Roof Police Siren Lightbar (Red & Blue Emergency Strobe)
    const lightbarMount = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.3), new THREE.MeshLambertMaterial({ color: 0x2d3436 }));
    lightbarMount.position.set(0, 1.84, -0.3);
    policeCar.add(lightbarMount);

    const redPod = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.26), lightbarRed);
    redPod.position.set(-0.24, 1.94, -0.3);
    policeCar.add(redPod);

    const bluePod = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.26), lightbarBlue);
    bluePod.position.set(0.24, 1.94, -0.3);
    policeCar.add(bluePod);

    policeCar.userData = { isPolice: true, redPod, bluePod };
    return policeCar;
  }

  /**
   * Civil Protection Fire Truck (شاحنة إطفاء الحماية المدنية 🚒)
   */
  createFireTruck(x, z, rotY = 0) {
    const truckGroup = new THREE.Group();
    truckGroup.position.set(x, 0, z);
    truckGroup.rotation.y = rotY;

    const redMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f6fa });
    const silverMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

    // Chassis & Red Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 6.2), redMat);
    body.position.y = 1.05;
    body.castShadow = true;
    truckGroup.add(body);

    // White Cab top
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.1, 2.4), whiteMat);
    cab.position.set(0, 2.1, 1.8);
    cab.castShadow = true;
    truckGroup.add(cab);

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.8), this.glassMat);
    windshield.position.set(0, 2.1, 3.02);
    truckGroup.add(windshield);

    // Equipment Bay Doors (Silver Roll-ups) on sides
    [-1.22, 1.22].forEach(sx => {
      [-0.8, -2.0].forEach(bz => {
        const bay = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), silverMat);
        bay.position.set(sx, 1.1, bz);
        bay.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        truckGroup.add(bay);
      });
    });

    // Roof Rescue Ladder
    const ladderSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 4.2), silverMat);
    ladderSideL.position.set(-0.4, 2.75, -0.6);
    truckGroup.add(ladderSideL);

    const ladderSideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 4.2), silverMat);
    ladderSideR.position.set(0.4, 2.75, -0.6);
    truckGroup.add(ladderSideR);

    for (let r = -2.4; r <= 1.2; r += 0.5) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.76, 6), silverMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 2.75, r);
      truckGroup.add(rung);
    }

    // Emergency Flashing Beacons (Blue & Yellow)
    const sirenL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0x0984e3 }));
    sirenL.position.set(-0.8, 2.75, 2.2);
    truckGroup.add(sirenL);

    const sirenR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 8), yellowMat);
    sirenR.position.set(0.8, 2.75, 2.2);
    truckGroup.add(sirenR);

    // 6 Big Wheels
    const wheels = [
      [-1.25, 0.45, 1.8], [1.25, 0.45, 1.8],
      [-1.25, 0.45, -1.2], [1.25, 0.45, -1.2],
      [-1.25, 0.45, -2.4], [1.25, 0.45, -2.4]
    ];
    wheels.forEach(([wx, wy, wz]) => {
      const wheel = this.createWheel(1.15);
      wheel.position.set(wx, wy, wz);
      truckGroup.add(wheel);
    });

    truckGroup.userData = { isFireTruck: true, sirenL, sirenR };
    this.scene.add(truckGroup);
    return truckGroup;
  }
}

