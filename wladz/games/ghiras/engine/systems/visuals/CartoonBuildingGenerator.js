import * as THREE from 'three';

/**
 * CartoonBuildingGenerator: Creates rich Stylized Cartoon 3D Architecture
 * inspired by City Island 5 reference image:
 * - Multi-story apartments with balconies, white trims, shutters, cornices
 * - Storefronts: Bakery (مخبزة), Cafe (مقهى), Greengrocer (خضر وفواكه)
 * - Rooftop props: water tanks, AC units, satellite dishes
 */
export class CartoonBuildingGenerator {
  constructor(scene) {
    this.scene = scene;
    this.initMaterials();
  }

  initMaterials() {
    // Facade Palette from reference: Lavender, Warm Peach, Cream, Emerald, Mint
    this.colors = {
      lavender: 0x6c5ce7,
      lightPurple: 0xa29bfe,
      peach: 0xf3a683,
      brickRed: 0xe17055,
      cream: 0xf7f1e3,
      emerald: 0x10ac84,
      mint: 0x1dd1a1,
      skyBlue: 0x74b9ff,
      terracotta: 0xb33939,
      whiteTrim: 0xf5f6fa,
      darkIron: 0x2d3436,
      woodBrown: 0x795548,
      glassCyan: 0x81ecec,
      awningOrange: 0xe67e22,
      awningYellow: 0xf1c40f
    };

    this.whiteMat = new THREE.MeshLambertMaterial({ color: this.colors.whiteTrim });
    this.ironMat = new THREE.MeshLambertMaterial({ color: this.colors.darkIron });
    this.woodMat = new THREE.MeshLambertMaterial({ color: this.colors.woodBrown });
    this.glassMat = new THREE.MeshLambertMaterial({ color: this.colors.glassCyan, transparent: true, opacity: 0.85 });
    this.waterTankMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    this.acMat = new THREE.MeshLambertMaterial({ color: 0xdfe6e9 });
  }

  /**
   * Stylized Cartoon Residential Apartment Building (2-4 Floors)
   */
  createCartoonApartment(x, z, width = 10, floors = 3, depth = 9, facadeColor = 0x6c5ce7, rotY = 0) {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0, z);
    bGroup.rotation.y = rotY;

    const floorH = 3.6;
    const totalH = floors * floorH;
    const wallMat = new THREE.MeshLambertMaterial({ color: facadeColor });

    // 1. Plinth / Foundation Base
    const baseGeo = new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4);
    const base = new THREE.Mesh(baseGeo, this.whiteMat);
    base.position.y = 0.2;
    base.receiveShadow = true;
    bGroup.add(base);

    // 2. Main Wall Body
    const bodyGeo = new THREE.BoxGeometry(width, totalH, depth);
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = totalH / 2 + 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    // 3. Horizontal White Floor Moldings / Cornices (like the City Island reference)
    for (let f = 1; f <= floors; f++) {
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.35, 0.28, depth + 0.35),
        this.whiteMat
      );
      cornice.position.y = f * floorH + 0.4;
      cornice.castShadow = true;
      bGroup.add(cornice);
    }

    // 4. Windows, Balconies and Shutters on Facade
    const numWindowsX = Math.floor(width / 3.0);
    const spacingX = width / (numWindowsX + 1);

    for (let f = 0; f < floors; f++) {
      const floorY = f * floorH + 0.4 + floorH * 0.55;

      for (let wx = 1; wx <= numWindowsX; wx++) {
        const posX = -width / 2 + wx * spacingX;

        // White Window Frame
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.6, 0.15),
          this.whiteMat
        );
        frame.position.set(posX, floorY, depth / 2 + 0.08);
        bGroup.add(frame);

        // Window Glass Pane
        const glass = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 1.3),
          this.glassMat
        );
        glass.position.set(posX, floorY, depth / 2 + 0.17);
        bGroup.add(glass);

        // Cross muntin bar on glass
        const muntinH = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.06), this.whiteMat);
        muntinH.position.set(posX, floorY, depth / 2 + 0.18);
        bGroup.add(muntinH);

        // Alternate floors having Balconies with Wrought Iron Railings
        if (f >= 1 && wx % 2 === 1) {
          // Balcony Concrete Slab
          const slab = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.18, 0.9),
            this.whiteMat
          );
          slab.position.set(posX, floorY - 0.85, depth / 2 + 0.45);
          slab.castShadow = true;
          bGroup.add(slab);

          // Balcony Iron Railing
          const balRailing = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.65, 0.05),
            this.ironMat
          );
          balRailing.position.set(posX, floorY - 0.5, depth / 2 + 0.9);
          bGroup.add(balRailing);

          // Flower planter on balcony railing!
          const flowerBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.22, 0.22),
            new THREE.MeshLambertMaterial({ color: 0xd35400 })
          );
          flowerBox.position.set(posX, floorY - 0.2, depth / 2 + 0.9);
          bGroup.add(flowerBox);

          const flowers = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0xf368e0 })
          );
          flowers.scale.set(3.0, 0.8, 1.0);
          flowers.position.set(posX, floorY - 0.08, depth / 2 + 0.9);
          bGroup.add(flowers);
        } else {
          // Mediterranean Blue/Wood Shutters on sides
          [-0.75, 0.75].forEach(sx => {
            const shutter = new THREE.Mesh(
              new THREE.BoxGeometry(0.35, 1.5, 0.08),
              new THREE.MeshLambertMaterial({ color: 0x2980b9 })
            );
            shutter.position.set(posX + sx, floorY, depth / 2 + 0.12);
            bGroup.add(shutter);
          });
        }
      }
    }

    // 5. Ground Floor Entrance Door
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.4, 0.16),
      this.whiteMat
    );
    doorFrame.position.set(0, 1.5, depth / 2 + 0.08);
    bGroup.add(doorFrame);

    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 2.2),
      this.woodMat
    );
    door.position.set(0, 1.5, depth / 2 + 0.17);
    bGroup.add(door);

    // 6. Rooftop Parapet, Terrace & Urban Algerian Props
    const parapetGeo = new THREE.BoxGeometry(width + 0.2, 0.9, depth + 0.2);
    const parapet = new THREE.Mesh(parapetGeo, this.whiteMat);
    parapet.position.y = totalH + 0.85;
    bGroup.add(parapet);

    // Cutout hollow roof deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.6, 0.2, depth - 0.6),
      new THREE.MeshLambertMaterial({ color: 0xdfe6e9 })
    );
    deck.position.y = totalH + 0.45;
    bGroup.add(deck);

    // Add Algerian Rooftop Water Tank (خزان مياه أسطواني)
    this.attachRooftopWaterTank(bGroup, -width / 3.2, totalH + 0.55, -depth / 3.5);

    // Add AC Compressor Unit (مكيف هواء)
    this.attachRooftopAC(bGroup, width / 3.2, totalH + 0.55, depth / 4);

    this.scene.add(bGroup);
    return bGroup;
  }

  /**
   * Stylized Commercial Shop / Storefront
   * (e.g. Mukhbaza / Bakery, Cafe, Grocery)
   */
  createCartoonShop(x, z, type = 'bakery', rotY = 0) {
    const shopGroup = new THREE.Group();
    shopGroup.position.set(x, 0, z);
    shopGroup.rotation.y = rotY;

    const width = 8.5;
    const height = 5.2;
    const depth = 7.5;

    // Config per shop type
    let wallColor = this.colors.peach;
    let awningColor1 = this.colors.awningOrange;
    let signTitle = '🍞 مخبزة الأصالة الجزائرية';
    let signColor = 0xd35400;

    if (type === 'cafe') {
      wallColor = this.colors.emerald;
      awningColor1 = 0x27ae60;
      signTitle = '☕ مقهى الأصدقاء';
      signColor = 0x16a085;
    } else if (type === 'grocer') {
      wallColor = this.colors.cream;
      awningColor1 = 0x2980b9;
      signTitle = '🥬 متجر خضر وفواكه بلادنا';
      signColor = 0x27ae60;
    } else if (type === 'clothes') {
      wallColor = 0xf3e5f5;
      awningColor1 = 0x8e44ad;
      signTitle = '👕 متجر الأناقة للملابس';
      signColor = 0x8e44ad;
    }

    // 1. Building Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshLambertMaterial({ color: wallColor })
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    shopGroup.add(body);

    // Decorative roof trim / cornice
    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, 0.45, depth + 0.5),
      this.whiteMat
    );
    roofTrim.position.y = height + 0.22;
    shopGroup.add(roofTrim);

    // 2. Large Stylized Arched / Glass Display Storefront
    const storeGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 2.6),
      this.glassMat
    );
    storeGlass.position.set(0, 1.8, depth / 2 + 0.05);
    shopGroup.add(storeGlass);

    // Frame
    const storeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 2.8, 0.12),
      this.whiteMat
    );
    storeFrame.position.set(0, 1.8, depth / 2 + 0.02);
    shopGroup.add(storeFrame);

    // 3. Iconic Striped Cartoon Awning (قماش ملون مائل)
    const awningGroup = new THREE.Group();
    awningGroup.position.set(0, 3.4, depth / 2 + 0.85);

    const awningW = 6.8;
    const numStripes = 8;
    const stripeW = awningW / numStripes;

    for (let s = 0; s < numStripes; s++) {
      const sColor = s % 2 === 0 ? awningColor1 : this.colors.whiteTrim;
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(stripeW, 0.08, 1.6),
        new THREE.MeshLambertMaterial({ color: sColor })
      );
      stripe.position.set(-awningW / 2 + s * stripeW + stripeW / 2, 0, 0);
      stripe.rotation.x = 0.35; // Slanted forward
      stripe.castShadow = true;
      awningGroup.add(stripe);

      // Scalloped ruffle bottom edge
      const ruffle = new THREE.Mesh(
        new THREE.BoxGeometry(stripeW, 0.25, 0.06),
        new THREE.MeshLambertMaterial({ color: sColor })
      );
      ruffle.position.set(-awningW / 2 + s * stripeW + stripeW / 2, -0.32, 0.72);
      awningGroup.add(ruffle);
    }
    shopGroup.add(awningGroup);

    // 4. Beautiful Shop Sign Board Mounted above awning
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.85, 0.18),
      new THREE.MeshLambertMaterial({ color: signColor })
    );
    signBoard.position.set(0, 4.35, depth / 2 + 0.1);
    shopGroup.add(signBoard);

    const signTrim = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.95, 0.12),
      this.whiteMat
    );
    signTrim.position.set(0, 4.35, depth / 2 + 0.06);
    shopGroup.add(signTrim);

    // 5. Front Display Crates / Baskets
    if (type === 'bakery') {
      // Golden Baguettes and bread basket
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.8),
        this.woodMat
      );
      crate.position.set(2.4, 0.35, depth / 2 + 0.7);
      shopGroup.add(crate);

      for (let b = -0.35; b <= 0.35; b += 0.35) {
        const loaf = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8),
          new THREE.MeshLambertMaterial({ color: 0xf39c12 })
        );
        loaf.rotation.x = 0.4;
        loaf.position.set(2.4 + b, 0.85, depth / 2 + 0.65);
        shopGroup.add(loaf);
      }
    } else if (type === 'grocer') {
      // Fruit crates (apples, oranges, greens)
      const crateColors = [0xe74c3c, 0xf39c12, 0x27ae60];
      [-2.4, 2.4].forEach((cx, idx) => {
        const cr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), this.woodMat);
        cr.position.set(cx, 0.3, depth / 2 + 0.7);
        shopGroup.add(cr);

        const fruits = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 6),
          new THREE.MeshLambertMaterial({ color: crateColors[idx] })
        );
        fruits.scale.set(1.6, 0.6, 1.0);
        fruits.position.set(cx, 0.65, depth / 2 + 0.7);
        shopGroup.add(fruits);
      });
    }

    this.scene.add(shopGroup);
    return shopGroup;
  }

  /**
   * Algerian Rooftop Water Tank (خزان ماء أسطواني مع أرجل تثبيت)
   */
  attachRooftopWaterTank(group, x, y, z) {
    const tankGroup = new THREE.Group();
    tankGroup.position.set(x, y, z);

    // 4 Steel Legs
    [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), this.ironMat);
      leg.position.set(lx, 0.4, lz);
      tankGroup.add(leg);
    });

    // Cylindrical Galvanized Tank
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 1.4, 16),
      this.waterTankMat
    );
    tank.position.y = 1.45;
    tank.castShadow = true;
    tankGroup.add(tank);

    // Ribbed rings around tank
    [-0.3, 0.3].forEach(ry => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 6, 16), this.ironMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.45 + ry;
      tankGroup.add(ring);
    });

    // Top inspection lid
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 10), this.waterTankMat);
    lid.position.y = 2.2;
    tankGroup.add(lid);

    group.add(tankGroup);
  }

  /**
   * Rooftop AC Compressor Unit (وحدة تكييف هوائي كرتونية)
   */
  attachRooftopAC(group, x, y, z) {
    const acGroup = new THREE.Group();
    acGroup.position.set(x, y, z);

    // Main Box
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.85, 0.6),
      this.acMat
    );
    box.position.y = 0.45;
    box.castShadow = true;
    acGroup.add(box);

    // Fan Grille (Front circle)
    const grille = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 12),
      new THREE.MeshLambertMaterial({ color: 0x636e72 })
    );
    grille.position.set(-0.15, 0.45, 0.31);
    acGroup.add(grille);

    group.add(acGroup);
  }

  /**
   * Algerian National Police Station (مقر الأمن الوطني الجزائري)
   */
  createPoliceStation(x, z, rotY = 0) {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, 0, z);
    pGroup.rotation.y = rotY;

    const policeBlue = new THREE.MeshLambertMaterial({ color: 0x1b3b6f });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f6fa });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const beaconBlueMat = new THREE.MeshBasicMaterial({ color: 0x0984e3 });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

    // 1. Base Pavement & Steps
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 14), whiteMat);
    base.position.y = 0.15;
    base.receiveShadow = true;
    pGroup.add(base);

    // 2. Main 2-Story Building Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(14, 7.5, 12), whiteMat);
    body.position.y = 3.9;
    body.castShadow = true;
    body.receiveShadow = true;
    pGroup.add(body);

    // 3. Iconic National Police Blue Stripe across top & entrance
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.9, 12.2), policeBlue);
    stripe.position.y = 7.2;
    pGroup.add(stripe);

    // Entrance Portico with columns
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.5, 3.2), policeBlue);
    porticoRoof.position.set(0, 4.4, 6.8);
    porticoRoof.castShadow = true;
    pGroup.add(porticoRoof);

    [-2.6, 2.6].forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.2, 12), whiteMat);
      col.position.set(cx, 2.2, 7.8);
      col.castShadow = true;
      pGroup.add(col);
    });

    // Glass Double Doors
    const doors = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), this.glassMat);
    doors.position.set(0, 1.8, 6.02);
    pGroup.add(doors);

    // Blue Emergency Flashing Beacons above entrance
    [-2.4, 2.4].forEach(bx => {
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 10), beaconBlueMat);
      beacon.position.set(bx, 4.8, 6.8);
      pGroup.add(beacon);
    });

    // National Police Badge / Sign Board
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 0.25), policeBlue);
    signBoard.position.set(0, 5.3, 6.1);
    pGroup.add(signBoard);

    const signEmblem = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), goldMat);
    signEmblem.position.set(0, 5.3, 6.24);
    pGroup.add(signEmblem);

    // Grid of modern windows with security frames
    for (let f = 0; f < 2; f++) {
      const wy = f === 0 ? 2.4 : 5.6;
      [-4.6, 4.6].forEach(wx => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.15), darkMat);
        win.position.set(wx, wy, 6.05);
        pGroup.add(win);

        const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), this.glassMat);
        glass.position.set(wx, wy, 6.14);
        pGroup.add(glass);
      });
    }

    // Communication Antenna Mast on Roof
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 4.5, 8), darkMat);
    mast.position.set(-4.5, 9.8, -3.5);
    pGroup.add(mast);

    const radarDish = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.1, 0.2, 12), whiteMat);
    radarDish.rotation.x = 0.5;
    radarDish.position.set(4.5, 8.4, -3.5);
    pGroup.add(radarDish);

    this.scene.add(pGroup);
    return pGroup;
  }

  /**
   * Civil Protection & Fire Station (مركز الحماية المدنية والإطفاء)
   */
  createCivilProtectionStation(x, z, rotY = 0) {
    const cpGroup = new THREE.Group();
    cpGroup.position.set(x, 0, z);
    cpGroup.rotation.y = rotY;

    const redMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f6fa });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

    // Foundation
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 13), whiteMat);
    base.position.y = 0.15;
    base.receiveShadow = true;
    cpGroup.add(base);

    // Main Station Building
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(14, 7.2, 11), whiteMat);
    mainBody.position.y = 3.75;
    mainBody.castShadow = true;
    cpGroup.add(mainBody);

    // Distinctive Red Top Cornice & Trim
    const redTrim = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.8, 11.2), redMat);
    redTrim.position.y = 7.4;
    cpGroup.add(redTrim);

    // 2 Large Fire Truck Roll-up Garage Doors (أبواب مرآب شاحنات الإطفاء)
    [-3.2, 3.2].forEach(gx => {
      const garageFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.6, 0.3), redMat);
      garageFrame.position.set(gx, 2.45, 5.55);
      cpGroup.add(garageFrame);

      const shutter = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.0), darkMat);
      shutter.position.set(gx, 2.3, 5.72);
      cpGroup.add(shutter);

      // Warning hazard stripes above garage
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.35), yellowMat);
      stripe.position.set(gx, 4.4, 5.73);
      cpGroup.add(stripe);
    });

    // Lookout / Siren Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, 11.0, 3.2), redMat);
    tower.position.set(-5.2, 5.8, -3.8);
    tower.castShadow = true;
    cpGroup.add(tower);

    // Rotating emergency red beacon on tower top
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.45, 10), redMat);
    beacon.position.set(-5.2, 11.5, -3.8);
    cpGroup.add(beacon);

    // Mounted Sign Board
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.0, 0.2), redMat);
    signBoard.position.set(0, 5.6, 5.6);
    cpGroup.add(signBoard);

    this.scene.add(cpGroup);
    return cpGroup;
  }

  /**
   * Town Hall / Municipality (مقر البلدية APC)
   */
  createTownHall(x, z, rotY = 0) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.rotation.y = rotY;

    const marbleMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
    const greenMat = new THREE.MeshLambertMaterial({ color: 0x16a085 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f });

    // Grand Terraced Steps
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(17 - s * 1.2, 0.3, 14 - s * 0.8), marbleMat);
      step.position.y = 0.15 + s * 0.25;
      step.receiveShadow = true;
      tGroup.add(step);
    }

    // Main Civic Hall
    const hall = new THREE.Mesh(new THREE.BoxGeometry(15, 8.2, 11), marbleMat);
    hall.position.y = 4.8;
    hall.castShadow = true;
    hall.receiveShadow = true;
    tGroup.add(hall);

    // 4 Majestic Neoclassical Columns at Entrance
    for (let c = -4.5; c <= 4.5; c += 3.0) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 6.8, 14), marbleMat);
      col.position.set(c, 4.2, 6.2);
      col.castShadow = true;
      tGroup.add(col);
    }

    // Triangular Pediment Roof
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(8.2, 2.4, 4), greenMat);
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(0, 9.8, 5.8);
    tGroup.add(pediment);

    // Civic Clock in pediment center
    const clock = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    clock.position.set(0, 9.6, 6.2);
    tGroup.add(clock);

    // Gold Clock hands
    const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.55), goldMat);
    hand.position.set(0, 9.75, 6.22);
    tGroup.add(hand);

    // Official Emblem & Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.1, 0.2), greenMat);
    sign.position.set(0, 7.8, 5.7);
    tGroup.add(sign);

    this.scene.add(tGroup);
    return tGroup;
  }

  /**
   * Casbah Traditional Heritage Quarter (دار التراث والقصبة العتيقة)
   */
  createCasbahHeritage(x, z, rotY = 0) {
    const cGroup = new THREE.Group();
    cGroup.position.set(x, 0, z);
    cGroup.rotation.y = rotY;

    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xfcfcfc });
    const turquoiseMat = new THREE.MeshLambertMaterial({ color: 0x00cec9 });
    const terracottaMat = new THREE.MeshLambertMaterial({ color: 0xb33939 });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });

    // Raised Stone Courtyard
    const court = new THREE.Mesh(new THREE.BoxGeometry(13, 0.25, 11), new THREE.MeshLambertMaterial({ color: 0xe0d6c8 }));
    court.position.y = 0.12;
    court.receiveShadow = true;
    cGroup.add(court);

    // Traditional 2-story Casbah House Body
    const house = new THREE.Mesh(new THREE.BoxGeometry(11, 6.8, 8.5), whiteMat);
    house.position.set(0, 3.5, -0.8);
    house.castShadow = true;
    cGroup.add(house);

    // Cantilevered Upper Floor (Saqifa / خروجة معمارية عريقة)
    const overhang = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.2, 2.2), whiteMat);
    overhang.position.set(0, 5.1, 3.8);
    overhang.castShadow = true;
    cGroup.add(overhang);

    // Wood Brackets supporting overhang
    [-2.8, 0, 2.8].forEach(bx => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 1.8), woodMat);
      bracket.position.set(bx, 3.0, 3.2);
      cGroup.add(bracket);
    });

    // Turquoise Blue Wooden Mashrabiya (مشربية خشبية فيروزية)
    const mashrabiya = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.3), turquoiseMat);
    mashrabiya.position.set(0, 5.2, 4.95);
    cGroup.add(mashrabiya);

    // Traditional Moorish Keyhole Arched Doorway (باب القصبة الأصيل)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.15), woodMat);
    door.position.set(0, 1.5, 3.48);
    cGroup.add(door);

    // Terracotta Spanish/Moorish Roof Tiles along the rim
    const roof = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.4, 8.9), terracottaMat);
    roof.position.set(0, 7.0, -0.8);
    cGroup.add(roof);

    // Ceramic Pottery & Copper Artisan Vessels outside the doorway
    const potteryMat = new THREE.MeshLambertMaterial({ color: 0xd35400 });
    const copperMat = new THREE.MeshLambertMaterial({ color: 0xb87333 });

    [-1.6, 1.6].forEach((vx, idx) => {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.75, 10), idx === 0 ? potteryMat : copperMat);
      jar.position.set(vx, 0.5, 3.8);
      cGroup.add(jar);
    });

    this.scene.add(cGroup);
    return cGroup;
  }
}

