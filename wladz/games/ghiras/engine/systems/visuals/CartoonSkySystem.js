import * as THREE from 'three';

/**
 * CartoonSkySystem: Creates stylized 3D clouds and cartoon airship/blimp
 * inspired by the City Island 5 art direction reference.
 */
export class CartoonSkySystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.blimp = null;
    this.blimpPropeller = null;

    this.initSkyElements();
  }

  initSkyElements() {
    this.cloudGroup = new THREE.Group();
    this.scene.add(this.cloudGroup);

    // Create 12 procedural puffy cartoon clouds at varied heights and positions
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: false
    });

    const cloudData = [
      { x: -50, y: 38, z: -40, scale: 1.2, speed: 1.2 },
      { x: 20,  y: 42, z: -60, scale: 1.5, speed: 0.9 },
      { x: -30, y: 35, z: 50,  scale: 1.0, speed: 1.1 },
      { x: 60,  y: 40, z: 30,  scale: 1.4, speed: 0.8 },
      { x: -70, y: 44, z: 10,  scale: 1.3, speed: 1.0 },
      { x: 10,  y: 36, z: -20, scale: 0.9, speed: 1.3 },
      { x: 45,  y: 46, z: -45, scale: 1.6, speed: 0.7 },
      { x: -20, y: 40, z: -70, scale: 1.1, speed: 1.0 },
      { x: 75,  y: 39, z: -10, scale: 1.3, speed: 0.85 },
      { x: -60, y: 45, z: 60,  scale: 1.4, speed: 0.95 },
      { x: 30,  y: 37, z: 65,  scale: 1.2, speed: 1.15 },
      { x: -10, y: 43, z: 25,  scale: 0.85, speed: 1.4 }
    ];

    cloudData.forEach(cd => {
      const cloud = this.createPuffyCloud(cloudMat, cd.scale);
      cloud.position.set(cd.x, cd.y, cd.z);
      cloud.userData = { speed: cd.speed, initialZ: cd.z };
      this.cloudGroup.add(cloud);
      this.clouds.push(cloud);
    });

    // Whimsical Cartoon Blimp (just like in the City Island reference image)
    this.createCartoonBlimp();
  }

  createPuffyCloud(material, scale = 1.0) {
    const group = new THREE.Group();

    // 5-7 clustered spheres forming a puffy fluffy cloud
    const spheres = [
      { r: 2.8, ox: 0,    oy: 0,   oz: 0 },
      { r: 2.2, ox: -2.3, oy: -0.4, oz: 0.2 },
      { r: 2.3, ox: 2.4,  oy: -0.3, oz: -0.2 },
      { r: 1.9, ox: -1.2, oy: 1.4,  oz: 0.1 },
      { r: 2.0, ox: 1.2,  oy: 1.3,  oz: -0.1 },
      { r: 1.6, ox: 0,    oy: -0.8, oz: 1.2 },
      { r: 1.5, ox: 0,    oy: -0.8, oz: -1.2 }
    ];

    spheres.forEach(s => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(s.r * scale, 12, 10),
        material
      );
      mesh.position.set(s.ox * scale, s.oy * scale, s.oz * scale);
      group.add(mesh);
    });

    return group;
  }

  createCartoonBlimp() {
    const blimpGroup = new THREE.Group();
    blimpGroup.position.set(-25, 48, -25);
    blimpGroup.rotation.y = Math.PI / 6;

    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xf39c12 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const grayMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
    const cyanMat = new THREE.MeshLambertMaterial({ color: 0x3498db });

    // Main Balloon Body (Egg/Capsule shaped)
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 20, 16),
      yellowMat
    );
    balloon.scale.set(1.9, 1.0, 1.0);
    blimpGroup.add(balloon);

    // Decorative White Center Stripe
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(3.52, 3.52, 1.6, 20),
      whiteMat
    );
    stripe.rotation.z = Math.PI / 2;
    blimpGroup.add(stripe);

    // Red Front Nose Cap
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 16, 12),
      redMat
    );
    nose.position.set(5.8, 0, 0);
    nose.scale.set(0.6, 1.0, 1.0);
    blimpGroup.add(nose);

    // Tail Fins (Top, Bottom, Left, Right)
    const finGeo = new THREE.BoxGeometry(1.6, 1.8, 0.15);
    const topFin = new THREE.Mesh(finGeo, redMat);
    topFin.position.set(-5.6, 1.8, 0);
    topFin.rotation.z = -0.3;
    blimpGroup.add(topFin);

    const botFin = new THREE.Mesh(finGeo, redMat);
    botFin.position.set(-5.6, -1.8, 0);
    botFin.rotation.z = 0.3;
    blimpGroup.add(botFin);

    const sideFinGeo = new THREE.BoxGeometry(1.6, 0.15, 1.8);
    const lFin = new THREE.Mesh(sideFinGeo, redMat);
    lFin.position.set(-5.6, 0, 1.8);
    blimpGroup.add(lFin);
    const rFin = new THREE.Mesh(sideFinGeo, redMat);
    rFin.position.set(-5.6, 0, -1.8);
    blimpGroup.add(rFin);

    // Passenger Gondola / Cabin below balloon
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.1, 1.2),
      cyanMat
    );
    cabin.position.set(0.5, -3.2, 0);
    blimpGroup.add(cabin);

    // Cabin Windows
    const cabinWin = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.45),
      whiteMat
    );
    cabinWin.position.set(0.5, -3.1, 0.61);
    blimpGroup.add(cabinWin);

    // Propeller at the rear of gondola
    const propHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8),
      grayMat
    );
    propHub.rotation.z = Math.PI / 2;
    propHub.position.set(-0.8, -3.2, 0);
    blimpGroup.add(propHub);

    const propBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.2, 0.15),
      grayMat
    );
    propBlade.position.set(-0.95, -3.2, 0);
    blimpGroup.add(propBlade);
    this.blimpPropeller = propBlade;

    this.scene.add(blimpGroup);
    this.blimp = blimpGroup;
  }

  update(dt, elapsed) {
    // Slowly drift clouds from West to East
    this.clouds.forEach(cloud => {
      cloud.position.x += dt * cloud.userData.speed * 1.5;
      if (cloud.position.x > 110) {
        cloud.position.x = -110;
      }
    });

    // Animate blimp gentle cruise and propeller rotation
    if (this.blimp) {
      this.blimp.position.x += Math.cos(elapsed * 0.15) * dt * 3.5;
      this.blimp.position.z += Math.sin(elapsed * 0.15) * dt * 3.5;
      this.blimp.position.y = 48 + Math.sin(elapsed * 0.8) * 0.8;
      this.blimp.rotation.y = elapsed * 0.15 + Math.PI / 2;

      if (this.blimpPropeller) {
        this.blimpPropeller.rotation.x += dt * 25;
      }
    }
  }
}
