import * as THREE from "three";

// Scène 3D du système solaire : textures procédurales, orbites, caméra qui suit l'astre choisi.

type BodyDef = {
  radius: number;
  orbit: number;
  spin: number;
  tilt: number;
  incl: number;
  parent?: string;
};

const bodyDefs: Record<string, BodyDef> = {
  sun: { radius: 5.6, orbit: 0, spin: 0.035, tilt: 0.12, incl: 0 },
  mercury: { radius: 0.72, orbit: 11, spin: 0.1, tilt: 0.03, incl: 0.12 },
  venus: { radius: 1.05, orbit: 15.5, spin: -0.05, tilt: 0.05, incl: 0.06 },
  earth: { radius: 1.1, orbit: 21, spin: 0.22, tilt: 0.41, incl: 0.02 },
  moon: { radius: 0.34, orbit: 2.6, spin: 0.09, tilt: 0.09, incl: 0.1, parent: "earth" },
  mars: { radius: 0.86, orbit: 26.5, spin: 0.2, tilt: 0.44, incl: 0.05 },
  jupiter: { radius: 3.0, orbit: 35, spin: 0.42, tilt: 0.05, incl: 0.03 },
  saturn: { radius: 2.6, orbit: 45, spin: 0.38, tilt: 0.47, incl: 0.04 },
  uranus: { radius: 1.75, orbit: 54, spin: -0.28, tilt: 1.71, incl: 0.03 },
  neptune: { radius: 1.68, orbit: 63, spin: 0.3, tilt: 0.49, incl: 0.02 },
};

type SceneBody = {
  radius: number;
  angle: number;
  baseSpeed: number;
  spin: number;
  holder?: THREE.Object3D;
  pivot?: THREE.Object3D;
  mesh?: THREE.Mesh;
  clouds?: THREE.Mesh;
  focusRing?: THREE.Sprite;
  corona?: THREE.Sprite;
  halo?: THREE.Sprite;
  sprite?: THREE.Sprite;
  spriteScale?: number;
};

type ParticleGroup = {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  velocities: THREE.Vector3[];
  life: number;
};

export type SpaceScene = {
  focusOn: (id: string) => void;
  goHome: () => void;
  burst: (id: string) => void;
  setInteractive: (interactive: boolean) => void;
  dispose: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

const TEX_W = 768;
const TEX_H = 384;

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function planetTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const texture = canvasTexture(TEX_W, TEX_H, draw);
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16));
}

function bandedTexture(
  palette: string[],
  streaks: number,
  spot?: { x: number; y: number; rx: number; ry: number; color: string },
) {
  const colors = palette.map(hexToRgb);
  return planetTexture((ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      const t = (y / h) * (colors.length - 1);
      const i = Math.min(colors.length - 2, Math.floor(t));
      const mixed = colors[i].map((channel, c) => Math.floor(channel + (colors[i + 1][c] - channel) * (t - i)));
      ctx.fillStyle = `rgb(${mixed.join(",")})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < streaks; i++) {
      ctx.globalAlpha = rand(0.04, 0.13);
      ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
      ctx.beginPath();
      ctx.ellipse(rand(0, w), rand(0, h), rand(30, 240), rand(2, 11), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (spot) {
      ctx.save();
      ctx.filter = "blur(7px)";
      ctx.fillStyle = spot.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(spot.x * w, spot.y * h, spot.rx, spot.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(spot.x * w, spot.y * h, spot.rx * 1.35, spot.ry * 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

function craterTexture(base: string, dark: string, light: string, craters: number) {
  return planetTexture((ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      ctx.globalAlpha = rand(0.04, 0.15);
      ctx.fillStyle = Math.random() > 0.5 ? light : dark;
      const r = rand(10, 82);
      ctx.beginPath();
      ctx.ellipse(rand(0, w), rand(0, h), r, r * rand(0.55, 1.15), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < craters; i++) {
      const x = rand(0, w);
      const y = rand(0, h);
      const r = rand(2, 17);
      const gradient = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.08, x, y, r);
      gradient.addColorStop(0, dark);
      gradient.addColorStop(0.5, base);
      gradient.addColorStop(1, light);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function earthTexture() {
  return planetTexture((ctx, w, h) => {
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, "#0e3266");
    ocean.addColorStop(0.35, "#175da3");
    ocean.addColorStop(0.65, "#1a68b4");
    ocean.addColorStop(1, "#0e3266");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    const land = ["#2f7a3f", "#3f8a4a", "#5d8f3c", "#b39a5e", "#8a7a45", "#35704a"];
    ctx.globalAlpha = 0.92;
    for (let i = 0; i < 17; i++) {
      const cx = rand(0, w);
      const cy = h * 0.14 + rand(0, h * 0.72);
      const blobs = 14 + Math.floor(rand(0, 20));
      for (let j = 0; j < blobs; j++) {
        const angle = rand(0, Math.PI * 2);
        const distance = rand(0, 60);
        ctx.fillStyle = land[Math.floor(Math.random() * land.length)];
        ctx.beginPath();
        ctx.ellipse(
          cx + Math.cos(angle) * distance,
          cy + Math.sin(angle) * distance * 0.68,
          rand(14, 50),
          rand(11, 37),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    for (const [from, to] of [
      [0, 42],
      [h, h - 42],
    ]) {
      const ice = ctx.createLinearGradient(0, from, 0, to);
      ice.addColorStop(0, "rgba(240,250,255,0.98)");
      ice.addColorStop(1, "rgba(240,250,255,0)");
      ctx.fillStyle = ice;
      ctx.fillRect(0, Math.min(from, to), w, 42);
    }
  });
}

function cloudTexture() {
  return planetTexture((ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 260; i++) {
      const r = rand(8, 50);
      ctx.globalAlpha = rand(0.05, 0.18);
      ctx.beginPath();
      ctx.ellipse(rand(0, w), rand(0, h), r, r * rand(0.35, 0.62), rand(-0.3, 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function sunTexture() {
  return planetTexture((ctx, w, h) => {
    ctx.fillStyle = "#ffb703";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.globalAlpha = rand(0.05, 0.18);
      ctx.fillStyle = Math.random() > 0.45 ? "#fff3b0" : "#ff7b00";
      ctx.beginPath();
      ctx.arc(rand(0, w), rand(0, h), rand(4, 42), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function ringTexture() {
  const bands: [number, number, string][] = [
    [0.06, 0.22, "rgba(224,209,166,0.75)"],
    [0.22, 0.28, "rgba(150,138,110,0.30)"],
    [0.28, 0.48, "rgba(240,228,190,0.92)"],
    [0.48, 0.52, "rgba(120,110,92,0.16)"],
    [0.52, 0.72, "rgba(222,206,164,0.80)"],
    [0.72, 0.8, "rgba(160,146,116,0.34)"],
    [0.8, 0.94, "rgba(236,224,188,0.66)"],
  ];
  return canvasTexture(512, 8, (ctx) => {
    for (const [from, to, color] of bands) {
      ctx.fillStyle = color;
      ctx.fillRect(from * 512, 0, (to - from) * 512, 8);
    }
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
      ctx.fillRect(rand(0, 512), 0, 1, 8);
    }
  });
}

function glowTexture(stops: [number, string][], size = 256) {
  return canvasTexture(size, size, (ctx) => {
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

const softDot = () =>
  glowTexture(
    [
      [0, "rgba(255,255,255,1)"],
      [0.35, "rgba(255,255,255,0.65)"],
      [1, "rgba(255,255,255,0)"],
    ],
    64,
  );

const glowSprite = (inner: string, outer: string) =>
  glowTexture([
    [0, inner],
    [0.25, outer],
    [1, "rgba(255,255,255,0)"],
  ]);

function starBurstTexture() {
  return canvasTexture(256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.12, "rgba(215,245,255,0.92)");
    gradient.addColorStop(0.38, "rgba(120,195,255,0.32)");
    gradient.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalCompositeOperation = "lighter";
    for (const angle of [0, Math.PI / 2]) {
      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(angle);
      const ray = ctx.createLinearGradient(-128, 0, 128, 0);
      ray.addColorStop(0, "rgba(255,255,255,0)");
      ray.addColorStop(0.5, "rgba(255,255,255,0.9)");
      ray.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(-128, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(128, 0);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });
}

function nebulaTexture() {
  const colors = ["rgba(140,80,255,", "rgba(220,80,200,", "rgba(80,140,255,", "rgba(255,120,180,"];
  return canvasTexture(512, 512, (ctx) => {
    for (let i = 0; i < 70; i++) {
      const x = rand(120, 392);
      const y = rand(120, 392);
      const r = rand(40, 170);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `${color}${rand(0.16, 0.32)})`);
      gradient.addColorStop(1, `${color}0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 160; i++) {
      ctx.globalAlpha = rand(0.5, 1);
      ctx.beginPath();
      ctx.arc(rand(0, 512), rand(0, 512), rand(0.4, 2.1), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function additiveSprite(map: THREE.Texture, opacity = 1) {
  return new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity,
    }),
  );
}

function spherePoints(count: number, minRadius: number, maxRadius: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = rand(minRadius, maxRadius);
    const theta = rand(0, Math.PI * 2);
    const phi = Math.acos(rand(-1, 1));
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return positions;
}

export function createSpaceScene(
  canvas: HTMLCanvasElement,
  onSelect: (id: string) => void,
): SpaceScene {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speedMul = reduced ? 0.35 : 1;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 5000);
  scene.add(new THREE.PointLight(0xfff0cf, 2.6, 0, 0));
  scene.add(new THREE.AmbientLight(0x5b74c4, 0.95));

  const pickables: THREE.Object3D[] = [];
  const bodies: Record<string, SceneBody> = {};
  const dot = softDot();

  /* ---------- star field ---------- */
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2800;
  const starColors = new Float32Array(starCount * 3);
  const starColor = new THREE.Color();
  for (let i = 0; i < starCount; i++) {
    starColor.setHSL(rand(0.55, 0.68), rand(0.35, 0.8), rand(0.72, 1));
    starColors.set([starColor.r, starColor.g, starColor.b], i * 3);
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(spherePoints(starCount, 430, 1380), 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      size: 4.2,
      map: dot,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.95,
    }),
  );
  scene.add(stars);

  const twinkleGeometry = new THREE.BufferGeometry();
  twinkleGeometry.setAttribute("position", new THREE.BufferAttribute(spherePoints(420, 600, 1300), 3));
  const twinkles = new THREE.Points(
    twinkleGeometry,
    new THREE.PointsMaterial({
      size: 9,
      map: dot,
      color: 0xbfe6ff,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    }),
  );
  scene.add(twinkles);

  /* ---------- shooting star ---------- */
  const shootingMaterial = new THREE.MeshBasicMaterial({
    map: canvasTexture(128, 8, (ctx) => {
      const trail = ctx.createLinearGradient(0, 0, 128, 0);
      trail.addColorStop(0, "rgba(255,255,255,0)");
      trail.addColorStop(0.75, "rgba(200,235,255,0.9)");
      trail.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = trail;
      ctx.fillRect(0, 0, 128, 8);
    }),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
  });
  const shootingStar = new THREE.Mesh(new THREE.PlaneGeometry(46, 1.1), shootingMaterial);
  shootingStar.visible = false;
  scene.add(shootingStar);
  const shooting = { timer: rand(4, 9), active: false, life: 0, direction: new THREE.Vector3() };

  function updateShootingStar(dt: number) {
    if (reduced) return;
    if (!shooting.active) {
      shooting.timer -= dt;
      if (shooting.timer > 0) return;
      shooting.active = true;
      shooting.life = 0;
      shootingStar.visible = true;
      const start = new THREE.Vector3(rand(-500, 500), rand(120, 380), rand(-700, -250));
      const end = new THREE.Vector3(
        start.x - rand(180, 380),
        start.y - rand(90, 200),
        start.z + rand(40, 160),
      );
      shootingStar.position.copy(start);
      shooting.direction.copy(end).sub(start).normalize();
      shootingStar.lookAt(end);
      shootingStar.rotateY(Math.PI / 2);
      return;
    }
    shooting.life += dt;
    shootingStar.position.addScaledVector(shooting.direction, 520 * dt);
    shootingMaterial.opacity = Math.sin(clamp(shooting.life / 1.5, 0, 1) * Math.PI) * 0.9;
    if (shooting.life > 1.5) {
      shooting.active = false;
      shootingStar.visible = false;
      shooting.timer = rand(7, 16);
    }
  }

  /* ---------- sun, planets, moon ---------- */
  const textures: Record<string, THREE.Texture> = {
    sun: sunTexture(),
    mercury: craterTexture("#8b8279", "#5c554e", "#b6ada2", 200),
    venus: bandedTexture(["#e9d296", "#f3e3b4", "#dfc584", "#f7ecc8", "#e5cf95", "#efdfae"], 260),
    earth: earthTexture(),
    moon: craterTexture("#9a9a9e", "#5c5c61", "#c9c9cd", 230),
    mars: bandedTexture(["#b8431a", "#c9541f", "#a83a12", "#d06a35", "#b9481c", "#c25622"], 300),
    jupiter: bandedTexture(
      ["#e6d3b3", "#c9a878", "#efe0c4", "#b98b55", "#e8d5b0", "#a9713f", "#dcbf95", "#c69a63", "#f0e3c8", "#bb8a52", "#e3cea8", "#cf9f6a"],
      340,
      { x: 0.68, y: 0.63, rx: 46, ry: 22, color: "#c0392b" },
    ),
    saturn: bandedTexture(["#e8d9a4", "#f2e7bf", "#d9c583", "#efe3b4", "#cbb06a", "#e6d7a0", "#d4bd7d", "#f5ecc9"], 200),
    uranus: bandedTexture(["#b8ecee", "#a3e2e6", "#c6f2f3", "#9adade", "#b0e8ea"], 120),
    neptune: bandedTexture(["#2a4fb8", "#3560d4", "#2b53bd", "#4571e0", "#2f58c4", "#3a66d6"], 200),
  };

  function createSun() {
    const def = bodyDefs.sun;
    const holder = new THREE.Object3D();
    scene.add(holder);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 56, 40),
      new THREE.MeshBasicMaterial({ map: textures.sun }),
    );
    mesh.userData.id = "sun";
    holder.add(mesh);
    pickables.push(mesh);

    const corona = additiveSprite(glowSprite("rgba(255,247,214,0.95)", "rgba(255,180,60,0.55)"), 0.9);
    const halo = additiveSprite(glowSprite("rgba(255,220,150,0.5)", "rgba(255,120,20,0.22)"), 0.55);
    holder.add(corona, halo);

    bodies.sun = { radius: def.radius, angle: 0, baseSpeed: 0, spin: def.spin, holder, mesh, corona, halo };
  }

  function createPlanet(id: string) {
    const def = bodyDefs[id];
    const pivot = new THREE.Object3D();
    pivot.rotation.x = def.incl;

    if (def.orbit > 0) {
      const points = Array.from({ length: 221 }, (_, i) => {
        const angle = (i / 220) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * def.orbit, 0, Math.sin(angle) * def.orbit);
      });
      pivot.add(
        new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: 0x5f7fd8, transparent: true, opacity: 0.16 }),
        ),
      );
    }

    const holder = new THREE.Object3D();
    holder.position.x = def.orbit;
    pivot.add(holder);

    const tilt = new THREE.Object3D();
    tilt.rotation.z = def.tilt;
    holder.add(tilt);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 48, 34),
      new THREE.MeshStandardMaterial({ map: textures[id], roughness: 0.95, metalness: 0 }),
    );
    tilt.add(mesh);

    if (id === "saturn") {
      const inner = def.radius * 1.42;
      const outer = def.radius * 2.45;
      const ringGeometry = new THREE.RingGeometry(inner, outer, 128, 1);
      const position = ringGeometry.attributes.position;
      const vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        ringGeometry.attributes.uv.setXY(i, (vertex.length() - inner) / (outer - inner), 0.5);
      }
      const ring = new THREE.Mesh(
        ringGeometry,
        new THREE.MeshBasicMaterial({
          map: ringTexture(),
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          opacity: 0.95,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      tilt.add(ring);
    }

    let clouds: THREE.Mesh | undefined;
    if (id === "earth") {
      clouds = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * 1.016, 48, 34),
        new THREE.MeshStandardMaterial({
          map: cloudTexture(),
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
          roughness: 1,
          metalness: 0,
        }),
      );
      tilt.add(clouds);
    }

    // Zone de clic plus large que l'astre, pour les petits doigts.
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(def.radius * 1.7, 2.4), 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.userData.id = id;
    tilt.add(hit);
    pickables.push(hit);

    const focusRing = additiveSprite(glowSprite("rgba(120,255,235,0.85)", "rgba(40,200,190,0.3)"), 0);
    tilt.add(focusRing);

    (def.parent ? bodies[def.parent].holder! : scene).add(pivot);
    bodies[id] = {
      radius: def.radius,
      angle: rand(0, Math.PI * 2),
      baseSpeed: def.parent ? 0.85 : (0.1396 * Math.pow(21, 1.5)) / Math.pow(def.orbit, 1.5),
      spin: def.spin,
      holder,
      pivot,
      mesh,
      clouds,
      focusRing,
    };
  }

  function createSpriteBody(id: string, map: THREE.Texture, position: [number, number, number], scale: number, radius: number) {
    const sprite = additiveSprite(map, id === "nebula" ? 0.92 : 1);
    sprite.position.set(...position);
    sprite.scale.setScalar(scale);
    sprite.userData.id = id;
    scene.add(sprite);
    pickables.push(sprite);
    bodies[id] = { radius, angle: 0, baseSpeed: 0, spin: 0, sprite, spriteScale: scale };
  }

  createSun();
  for (const id of ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "moon"]) {
    createPlanet(id);
  }
  createSpriteBody("stars", starBurstTexture(), [-72, 34, -46], 26, 6);
  createSpriteBody("nebula", nebulaTexture(), [88, -22, -86], 76, 22);

  function worldPosition(body: SceneBody, target: THREE.Vector3) {
    if (body.sprite) return target.copy(body.sprite.position);
    return body.holder!.getWorldPosition(target);
  }

  /* ---------- camera ---------- */
  const HOME = { theta: 1.05, phi: 0.92 };
  // Sur un écran étroit, on recule pour garder tout le système solaire visible.
  const homeRadius = () => clamp((158 * 1.25) / camera.aspect, 158, 330);
  const cam = {
    target: new THREE.Vector3(),
    goalTarget: new THREE.Vector3(),
    radius: 158,
    goalRadius: 158,
    theta: HOME.theta,
    goalTheta: HOME.theta,
    phi: HOME.phi,
    goalPhi: HOME.phi,
    follow: null as string | null,
    // Décalage vertical : l'astre suivi monte dans le cadre, au-dessus de la question.
    lift: 0,
  };
  const scratch = new THREE.Vector3();

  function goHome() {
    cam.follow = null;
    cam.goalTarget.set(0, 0, 0);
    cam.goalRadius = homeRadius();
    cam.goalTheta = HOME.theta;
    cam.goalPhi = HOME.phi;
  }

  function focusOn(id: string) {
    const body = bodies[id];
    if (!body) return;
    const position = worldPosition(body, new THREE.Vector3());
    cam.follow = id;
    cam.goalTarget.copy(position);
    cam.goalRadius = clamp((body.radius * 6.4 + 3.5) / Math.min(1, camera.aspect), 8, 220);

    const direction = position.clone().negate().normalize();
    if (direction.lengthSq() < 0.01) direction.set(0, 0.4, 1).normalize();
    cam.goalPhi = clamp(Math.acos(clamp(direction.y, -1, 1)), 0.35, 2.1);
    cam.goalTheta = Math.atan2(direction.z, direction.x);
  }

  function updateCamera(dt: number) {
    if (cam.follow) cam.goalTarget.copy(worldPosition(bodies[cam.follow], scratch));

    const k = 1 - Math.exp(-dt * (reduced ? 16 : 5.2));
    cam.target.lerp(cam.goalTarget, k);
    const deltaTheta = cam.goalTheta - cam.theta;
    cam.theta += Math.atan2(Math.sin(deltaTheta), Math.cos(deltaTheta)) * k;
    cam.phi += (cam.goalPhi - cam.phi) * k;
    cam.radius += (cam.goalRadius - cam.radius) * k;
    cam.lift += ((cam.follow ? 0.24 : 0) - cam.lift) * k;

    const sinPhi = Math.sin(cam.phi);
    camera.position.set(
      cam.target.x + cam.radius * sinPhi * Math.cos(cam.theta),
      cam.target.y + cam.radius * Math.cos(cam.phi),
      cam.target.z + cam.radius * sinPhi * Math.sin(cam.theta),
    );
    camera.lookAt(cam.target);
    camera.translateY(-cam.radius * cam.lift);
  }

  /* ---------- pointer: drag to orbit, tap to select, wheel to zoom ---------- */
  let interactive = true;
  let hoveredId: string | null = null;
  const pointer = new THREE.Vector2(-2, -2);
  const raycaster = new THREE.Raycaster();
  const drag = { active: false, moved: 0, x: 0, y: 0, startedAt: 0 };

  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return (hit?.object.userData.id as string | undefined) ?? null;
  }

  function setHovered(id: string | null) {
    hoveredId = id;
    canvas.style.cursor = id ? "pointer" : "grab";
  }

  function onPointerDown(event: PointerEvent) {
    if (!interactive) return;
    drag.active = true;
    drag.moved = 0;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.startedAt = performance.now();
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    setHovered(interactive ? pick(event) : null);
    if (!drag.active) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved < 6) return;
    cam.follow = null;
    cam.goalTheta -= dx * 0.0055;
    cam.goalPhi = clamp(cam.goalPhi - dy * 0.0045, 0.22, 1.62);
  }

  function onPointerUp(event: PointerEvent) {
    if (!drag.active) return;
    drag.active = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (drag.moved >= 10 || performance.now() - drag.startedAt >= 520) return;
    const id = pick(event);
    if (id) onSelect(id);
  }

  function onPointerCancel() {
    drag.active = false;
  }

  function onPointerLeave() {
    setHovered(null);
  }

  function onWheel(event: WheelEvent) {
    if (!interactive) return;
    event.preventDefault();
    cam.goalRadius = clamp(cam.goalRadius * (1 + Math.sign(event.deltaY) * 0.09), 7, 340);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  /* ---------- celebration particles ---------- */
  const particles: ParticleGroup[] = [];

  function burst(id: string) {
    const body = bodies[id];
    if (!body) return;
    const origin = worldPosition(body, new THREE.Vector3());
    const count = reduced ? 24 : 90;
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      positions.set([origin.x, origin.y, origin.z], i * 3);
      velocities.push(
        new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(2.5, 9)),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 2.4,
        map: dot,
        color: 0xffe08a,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(points);
    particles.push({ points, velocities, life: 0 });
  }

  function updateParticles(dt: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const group = particles[i];
      group.life += dt;
      const position = group.points.geometry.attributes.position;
      group.velocities.forEach((velocity, j) => {
        position.setXYZ(
          j,
          position.getX(j) + velocity.x * dt,
          position.getY(j) + velocity.y * dt,
          position.getZ(j) + velocity.z * dt,
        );
        velocity.multiplyScalar(0.965);
      });
      position.needsUpdate = true;
      group.points.material.opacity = Math.max(0, 1 - group.life / 2.1);
      if (group.life >= 2.1) {
        scene.remove(group.points);
        group.points.geometry.dispose();
        group.points.material.dispose();
        particles.splice(i, 1);
      }
    }
  }

  /* ---------- resize + render loop ---------- */
  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!cam.follow) cam.goalRadius = homeRadius();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  goHome();
  cam.radius = cam.goalRadius * 1.6;

  let lastFrame = performance.now();
  const hoverScale = new THREE.Vector3();
  let elapsed = 0;
  let frame = 0;

  function animate() {
    frame = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min(0.06, (now - lastFrame) / 1000);
    lastFrame = now;
    elapsed += dt;

    for (const [id, body] of Object.entries(bodies)) {
      if (body.baseSpeed && body.pivot) {
        body.angle += body.baseSpeed * speedMul * dt;
        body.pivot.rotation.y = body.angle;
      }
      if (body.mesh) body.mesh.rotation.y += body.spin * speedMul * dt;
      if (body.clouds) body.clouds.rotation.y += body.spin * 1.35 * speedMul * dt;
      if (body.corona && body.halo) {
        body.corona.scale.setScalar(body.radius * 5.4 * (1 + Math.sin(elapsed * 0.8) * 0.035));
        body.halo.scale.setScalar(body.radius * 9 * (1 + Math.sin(elapsed * 0.5 + 1) * 0.02));
      }

      const highlighted = hoveredId === id || cam.follow === id;
      if (body.focusRing) {
        const material = body.focusRing.material;
        material.opacity += ((highlighted ? 0.85 : 0) - material.opacity) * 0.12;
        body.focusRing.scale.setScalar(body.radius * 4.2 * (1 + Math.sin(elapsed * 3) * 0.05));
      }
      if (body.mesh && id !== "sun") {
        body.mesh.scale.lerp(hoverScale.setScalar(hoveredId === id ? 1.06 : 1), 0.15);
      }
      if (body.sprite && body.spriteScale) {
        const pulse = id === "stars" ? 1 + Math.sin(elapsed * 2.2) * 0.04 : 1;
        body.sprite.scale.setScalar(body.spriteScale * (highlighted ? 1.12 : 1) * pulse);
      }
    }
    bodies.nebula.sprite!.material.rotation = Math.sin(elapsed * 0.05) * 0.12;

    if (!reduced) {
      twinkles.material.opacity = 0.45 + Math.sin(elapsed * 1.6) * 0.28;
      stars.material.opacity = 0.88 + Math.sin(elapsed * 0.7) * 0.09;
    }

    updateShootingStar(dt);
    updateParticles(dt);
    updateCamera(dt);
    renderer.render(scene, camera);
  }
  animate();

  return {
    focusOn,
    goHome,
    burst,
    setInteractive(value) {
      interactive = value;
      if (!value) {
        drag.active = false;
        setHovered(null);
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        const item = object as Partial<THREE.Mesh<THREE.BufferGeometry, THREE.Material>>;
        item.geometry?.dispose();
        const material = item.material as (THREE.Material & { map?: THREE.Texture | null }) | undefined;
        material?.map?.dispose();
        material?.dispose();
      });
      renderer.dispose();
    },
  };
}
