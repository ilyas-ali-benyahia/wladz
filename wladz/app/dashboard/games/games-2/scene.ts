import type { SceneTarget } from "./data/cases";

type Point3 = readonly [number, number, number];
type MutablePoint3 = [number, number, number];
type Matrix = Float32Array;

type Mesh = {
  buffer: WebGLBuffer;
  vertexCount: number;
};

export type SchoolScene = {
  destroy: () => void;
  interact: () => void;
  setTarget: (target: SceneTarget) => void;
  setOutcome: (outcome: number) => void;
};

const targetPositions: Record<SceneTarget, Point3> = {
  classmate: [0, 0, 1],
  classmates: [3, 0, 1.5],
  bench: [-2, 0, 2],
  teacher: [-6, 0, -1],
  garden: [-8, 0, -2],
  basket: [7, 0, 3],
  classroom: [0, 0, -8],
  "school-bag": [-1, 0, 2.6],
  "notice-board": [6.5, 0, -9.9],
  ball: [5, 0, 4],
  "water-fountain": [-8, 0, 3],
  phone: [4, 0, 1.5],
};

function identity(): Matrix {
  const result = new Float32Array(16);
  result[0] = 1;
  result[5] = 1;
  result[10] = 1;
  result[15] = 1;
  return result;
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let index = 0; index < 4; index += 1) {
        result[column * 4 + row] +=
          a[index * 4 + row] * b[column * 4 + index];
      }
    }
  }
  return result;
}

function translation(x: number, y: number, z: number): Matrix {
  const result = identity();
  result[12] = x;
  result[13] = y;
  result[14] = z;
  return result;
}

function scaling(x: number, y: number, z: number): Matrix {
  const result = identity();
  result[0] = x;
  result[5] = y;
  result[10] = z;
  return result;
}

function rotationY(angle: number): Matrix {
  const result = identity();
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  result[0] = cosine;
  result[2] = -sine;
  result[8] = sine;
  result[10] = cosine;
  return result;
}

function perspective(aspect: number): Matrix {
  const f = 1 / Math.tan(Math.PI / 7);
  const near = 0.1;
  const far = 80;
  const result = new Float32Array(16);
  result[0] = f / aspect;
  result[5] = f;
  result[10] = (far + near) / (near - far);
  result[11] = -1;
  result[14] = (2 * far * near) / (near - far);
  return result;
}

function normalize(x: number, y: number, z: number): MutablePoint3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function lookAt(eye: Point3, target: Point3): Matrix {
  const zAxis = normalize(
    eye[0] - target[0],
    eye[1] - target[1],
    eye[2] - target[2],
  );
  const xAxis = normalize(zAxis[2], 0, -zAxis[0]);
  const yAxis: MutablePoint3 = [
    zAxis[1] * xAxis[2] - zAxis[2] * xAxis[1],
    zAxis[2] * xAxis[0] - zAxis[0] * xAxis[2],
    zAxis[0] * xAxis[1] - zAxis[1] * xAxis[0],
  ];
  const result = identity();
  result[0] = xAxis[0];
  result[1] = yAxis[0];
  result[2] = zAxis[0];
  result[4] = xAxis[1];
  result[5] = yAxis[1];
  result[6] = zAxis[1];
  result[8] = xAxis[2];
  result[9] = yAxis[2];
  result[10] = zAxis[2];
  result[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  result[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  result[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  return result;
}

function boxVertices(): number[] {
  const faces: Array<{ normal: Point3; corners: Point3[] }> = [
    { normal: [0, 0, 1], corners: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { normal: [0, 0, -1], corners: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { normal: [1, 0, 0], corners: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { normal: [-1, 0, 0], corners: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { normal: [0, 1, 0], corners: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { normal: [0, -1, 0], corners: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  const result: number[] = [];
  for (const { normal, corners } of faces) {
    for (const index of [0, 1, 2, 0, 2, 3]) {
      result.push(...corners[index], ...normal);
    }
  }
  return result;
}

function sphereVertices(): number[] {
  const result: number[] = [];
  const rows = 10;
  const columns = 14;
  for (let row = 0; row < rows; row += 1) {
    const top = (row / rows) * Math.PI;
    const bottom = ((row + 1) / rows) * Math.PI;
    for (let column = 0; column < columns; column += 1) {
      const left = (column / columns) * Math.PI * 2;
      const right = ((column + 1) / columns) * Math.PI * 2;
      const point = (phi: number, theta: number): MutablePoint3 => [
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      ];
      const a = point(top, left);
      const b = point(bottom, left);
      const c = point(bottom, right);
      const d = point(top, right);
      for (const vertex of [a, c, b, a, d, c]) {
        result.push(...vertex, ...vertex);
      }
    }
  }
  return result;
}

function coneVertices(): number[] {
  const result: number[] = [];
  const segments = 12;
  for (let index = 0; index < segments; index += 1) {
    const first = (index / segments) * Math.PI * 2;
    const second = ((index + 1) / segments) * Math.PI * 2;
    const a: Point3 = [Math.cos(first) * 0.5, -0.5, Math.sin(first) * 0.5];
    const b: Point3 = [Math.cos(second) * 0.5, -0.5, Math.sin(second) * 0.5];
    const peak: Point3 = [0, 0.5, 0];
    const normal = normalize(a[0] + b[0], 0.5, a[2] + b[2]);
    result.push(...a, ...normal, ...peak, ...normal, ...b, ...normal);
    result.push(0, -0.5, 0, 0, -1, 0, ...a, 0, -1, 0, ...b, 0, -1, 0);
  }
  return result;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("تعذّر تجهيز رسومات المشهد.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "خطأ غير معروف";
    gl.deleteShader(shader);
    throw new Error(`تعذّر تجهيز رسومات المشهد: ${message}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertex = compileShader(
    gl,
    gl.VERTEX_SHADER,
    "attribute vec3 aPosition; attribute vec3 aNormal; uniform mat4 uProjection; uniform mat4 uView; uniform mat4 uModel; varying float vLight; void main(){ vec3 normal=normalize(mat3(uModel)*aNormal); vLight=0.48+0.52*max(dot(normal,normalize(vec3(-0.45,0.85,0.3))),0.0); gl_Position=uProjection*uView*uModel*vec4(aPosition,1.0); }",
  );
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    "precision mediump float; uniform vec4 uColor; varying float vLight; void main(){ gl_FragColor=vec4(uColor.rgb*vLight,uColor.a); }",
  );
  const program = gl.createProgram();
  if (!program) throw new Error("تعذّر تشغيل رسومات المشهد.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "خطأ غير معروف";
    gl.deleteProgram(program);
    throw new Error(`تعذّر تشغيل رسومات المشهد: ${message}`);
  }
  return program;
}

export function createSchoolScene(
  canvas: HTMLCanvasElement,
  onNearbyChange: (nearby: boolean) => void,
  onInteract: () => void,
): SchoolScene {
  const context = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!context) {
    throw new Error("هذا المتصفح لا يدعم WebGL اللازم لعرض ساحة المدرسة.");
  }
  const gl: WebGLRenderingContext = context;

  const program = createProgram(gl);
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const normalLocation = gl.getAttribLocation(program, "aNormal");
  const projectionLocation = gl.getUniformLocation(program, "uProjection");
  const viewLocation = gl.getUniformLocation(program, "uView");
  const modelLocation = gl.getUniformLocation(program, "uModel");
  const colorLocation = gl.getUniformLocation(program, "uColor");

  function createMesh(vertices: number[]): Mesh {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("تعذّر إنشاء مجسمات ساحة المدرسة.");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return { buffer, vertexCount: vertices.length / 6 };
  }

  const box = createMesh(boxVertices());
  const sphere = createMesh(sphereVertices());
  const cone = createMesh(coneVertices());
  const meshes = [box, sphere, cone];
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.63, 0.84, 0.97, 1);

  const keys = new Set<string>();
  const player: MutablePoint3 = [-5, 0, 5];
  let playerFacing = 0;
  let cameraYaw = 0;
  let cameraPitch = 0.12;
  let pointerDown = false;
  let pointerMoved = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let outcome = -1;
  let outcomeStartedAt = 0;
  let currentTarget: SceneTarget = "classmate";
  let previousTime = 0;
  let frame = 0;
  let nearby = false;
  let destroyed = false;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  }

  function draw(
    mesh: Mesh,
    color: readonly [number, number, number, number],
    position: Point3,
    size: Point3,
    rotation = 0,
  ) {
    const model = multiply(
      translation(position[0], position[1], position[2]),
      multiply(rotationY(rotation), scaling(size[0], size[1], size[2])),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 24, 12);
    gl.uniformMatrix4fv(modelLocation, false, model);
    gl.uniform4fv(colorLocation, color);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }

  const colors = {
    grass: [0.36, 0.62, 0.38, 1] as const,
    path: [0.78, 0.69, 0.53, 1] as const,
    school: [0.91, 0.82, 0.66, 1] as const,
    roof: [0.72, 0.35, 0.25, 1] as const,
    window: [0.46, 0.73, 0.83, 1] as const,
    wood: [0.47, 0.29, 0.17, 1] as const,
    leaf: [0.22, 0.49, 0.3, 1] as const,
    player: [0.05, 0.39, 0.23, 1] as const,
    target: [0.17, 0.42, 0.72, 1] as const,
    peer: [0.85, 0.51, 0.21, 1] as const,
    skin: [0.78, 0.55, 0.39, 1] as const,
    highlight: [0.96, 0.78, 0.26, 1] as const,
    white: [0.97, 0.96, 0.91, 1] as const,
  };

  function drawCharacter(
    position: Point3,
    shirt: readonly [number, number, number, number],
    facing: number,
    bob: number,
    sitting = false,
    walkCycle = 0,
    gesture = false,
  ) {
    const [x, , z] = position;
    draw(box, shirt, [x, sitting ? 0.72 : 1.03 + bob, z], [0.68, sitting ? 0.76 : 0.95, 0.38], facing);
    draw(sphere, colors.skin, [x, sitting ? 1.38 : 1.72 + bob, z], [0.43, 0.48, 0.42]);
    const legMotion = sitting ? 0 : Math.sin(walkCycle) * 0.16;
    draw(box, colors.white, [x - 0.19, 0.37, z + legMotion], [0.16, 0.72, 0.18]);
    draw(box, colors.white, [x + 0.19, 0.37, z - legMotion], [0.16, 0.72, 0.18]);
    draw(box, shirt, [x - 0.42, 1.03 + bob, z - legMotion], [0.16, 0.65, 0.18], facing);
    draw(
      box,
      shirt,
      [x + 0.42, gesture ? 1.4 + bob : 1.03 + bob, z + (gesture ? -0.12 : legMotion)],
      [0.16, gesture ? 0.56 : 0.65, 0.18],
      facing,
    );
  }

  function render(time: number) {
    if (destroyed) return;
    const delta = Math.min((time - previousTime) / 1000 || 0, 0.04);
    previousTime = time;
    const forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) -
      Number(keys.has("KeyS") || keys.has("ArrowDown"));
    const side = Number(keys.has("KeyD") || keys.has("ArrowRight")) -
      Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    const length = Math.hypot(forward, side) || 1;
    const speed = 3.2 * delta;
    if (forward || side) {
      const normalizedForward = forward / length;
      const normalizedSide = side / length;
      const moveX =
        -Math.sin(cameraYaw) * normalizedForward +
        Math.cos(cameraYaw) * normalizedSide;
      const moveZ =
        -Math.cos(cameraYaw) * normalizedForward -
        Math.sin(cameraYaw) * normalizedSide;
      player[0] = Math.max(-11, Math.min(11, player[0] + moveX * speed));
      player[2] = Math.max(-9, Math.min(10, player[2] + moveZ * speed));
      playerFacing = Math.atan2(moveX, -moveZ);
    }

    const targetPosition = targetPositions[currentTarget];
    const distance = Math.hypot(
      player[0] - targetPosition[0],
      player[2] - targetPosition[2],
    );
    const canInteract = distance < 2.6;
    if (nearby !== canInteract) {
      nearby = canInteract;
      onNearbyChange(nearby);
    }

    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(projectionLocation, false, perspective(canvas.width / canvas.height));
    const horizontalDistance = 8.5 * Math.cos(cameraPitch);
    const eye: Point3 = [
      player[0] + Math.sin(cameraYaw) * horizontalDistance,
      3.5 + Math.sin(cameraPitch) * 7,
      player[2] + Math.cos(cameraYaw) * horizontalDistance,
    ];
    gl.uniformMatrix4fv(viewLocation, false, lookAt(eye, [player[0], 0.7, player[2]]));

    draw(box, colors.grass, [0, -0.18, 0], [30, 0.3, 28]);
    draw(box, colors.path, [0, -0.015, 2], [5, 0.06, 24]);
    draw(box, colors.school, [0, 2.1, -12], [16, 4.2, 1.3]);
    draw(box, colors.roof, [0, 4.45, -12], [16.8, 0.45, 1.7]);
    draw(box, colors.roof, [0, 5.5, -12.2], [7, 2.1, 1.4]);
    for (const x of [-5.5, -2.5, 2.5, 5.5]) {
      draw(box, colors.window, [x, 2.7, -11.28], [1.5, 1.45, 0.12]);
      draw(box, colors.white, [x, 2.7, -11.18], [0.12, 1.55, 0.08]);
      draw(box, colors.white, [x, 2.7, -11.17], [1.55, 0.12, 0.08]);
    }
    for (const x of [-12, -8, 8, 12]) {
      draw(box, colors.wood, [x, 1.15, -2], [0.18, 2.3, 0.18]);
      draw(cone, colors.leaf, [x, 2.75, -2], [2.2, 2.5, 2.2]);
      draw(cone, colors.leaf, [x, 3.65, -2], [1.5, 1.8, 1.5]);
    }
    for (let x = -12; x <= 12; x += 2) {
      draw(box, colors.white, [x, 0.58, 11], [0.14, 1.16, 0.14]);
    }
    draw(box, colors.wood, [0, 1.1, 11], [24, 0.12, 0.12]);
    draw(box, colors.wood, [0, 0.65, 11], [24, 0.12, 0.12]);

    draw(box, colors.wood, [-2, 0.62, 2], [2.4, 0.18, 0.55]);
    draw(box, colors.wood, [-2.8, 0.32, 2], [0.16, 0.62, 0.18]);
    draw(box, colors.wood, [-1.2, 0.32, 2], [0.16, 0.62, 0.18]);
    draw(box, colors.wood, [0, 0.78, 1], [3.2, 0.12, 0.12]);
    draw(box, colors.target, [-2, 0.92, 2], [0.55, 0.11, 0.42], 0.3);
    draw(box, colors.peer, [-1, 0.9, 2.3], [0.48, 0.12, 0.32], -0.2);
    draw(sphere, colors.peer, [5, 0.45, 4], [0.48, 0.48, 0.48], time / 700);
    draw(box, colors.target, [4, 0.45, 1.5], [0.42, 0.72, 0.1], 0.15);
    draw(box, colors.white, [4, 0.48, 1.43], [0.3, 0.42, 0.04], 0.15);
    draw(box, colors.wood, [6.5, 0.8, -9.85], [2.4, 1.6, 0.2]);
    draw(box, colors.highlight, [6.5, 0.83, -9.72], [1.9, 1.1, 0.08]);
    draw(box, colors.leaf, [-8, 0.22, -2], [2.2, 0.36, 1.4]);
    draw(box, colors.wood, [-8, 0.14, 3], [0.75, 0.28, 0.65]);
    draw(box, colors.white, [-8, 0.46, 3], [0.56, 0.42, 0.45]);
    draw(box, colors.wood, [7, 0.5, 3], [0.62, 1, 0.62]);
    draw(box, colors.target, [0, 1.2, -11.25], [1.4, 2.4, 0.16]);
    draw(box, colors.wood, [-1, 0.48, 2.6], [0.65, 0.55, 0.4]);
    draw(box, colors.highlight, [-1, 0.77, 2.6], [0.55, 0.1, 0.35]);
    drawCharacter(targetPositions.teacher, colors.highlight, 0.5, Math.sin(time / 400) * 0.015);
    const markerY = currentTarget === "classmate" || currentTarget === "classmates"
      ? 2.5
      : 1.7;
    draw(
      sphere,
      colors.highlight,
      [targetPosition[0], markerY + Math.sin(time / 220) * 0.08, targetPosition[2]],
      [0.24, 0.3, 0.24],
      time / 700,
    );

    const outcomeProgress =
      outcome < 0 ? 0 : Math.min((time - outcomeStartedAt) / 900, 1);
    const eased = outcomeProgress * outcomeProgress * (3 - 2 * outcomeProgress);
    const targetSitting = outcome < 0 || outcome === 2;
    drawCharacter(targetPosition, colors.target, 0, Math.sin(time / 240) * 0.025, targetSitting);
    const peerShift = outcome === 0 ? eased * 1.3 : outcome === 2 ? 0 : 0;
    drawCharacter([2.5 + peerShift, 0, 1.5], colors.peer, -0.8, Math.sin(time / 300) * 0.025);
    drawCharacter([4 + peerShift, 0, 0.4], colors.player, -0.6, Math.sin(time / 350) * 0.025);
    if (outcome === 1 && outcomeProgress > 0.05) {
      drawCharacter(
        [-6 + eased * 1.1, 0, -1],
        colors.highlight,
        0.4,
        Math.sin(time / 250) * 0.02,
        false,
        0,
        true,
      );
    }

    const walkingBob = forward || side ? Math.sin(time / 65) * 0.06 : Math.sin(time / 420) * 0.018;
    drawCharacter(player, colors.player, playerFacing, walkingBob, false, time / 65);
    frame = window.requestAnimationFrame(render);
  }

  function keyDown(event: KeyboardEvent) {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    if (event.code === "KeyE" && !event.repeat && nearby) onInteract();
  }

  function keyUp(event: KeyboardEvent) {
    keys.delete(event.code);
  }

  function blur() {
    keys.clear();
  }

  function pointerStart(event: PointerEvent) {
    pointerDown = true;
    pointerMoved = false;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (!pointerDown) return;
    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) pointerMoved = true;
    cameraYaw -= deltaX * 0.008;
    cameraPitch = Math.max(-0.08, Math.min(0.55, cameraPitch - deltaY * 0.004));
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  }

  function pointerEnd() {
    if (pointerDown && !pointerMoved && nearby) onInteract();
    pointerDown = false;
  }

  function pointerCancel() {
    pointerDown = false;
  }

  function visibilityChange() {
    if (document.hidden) keys.clear();
  }

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibilityChange);
  canvas.addEventListener("pointerdown", pointerStart);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerCancel);
  frame = window.requestAnimationFrame(render);

  return {
    interact() {
      if (nearby) onInteract();
    },
    setTarget(target) {
      currentTarget = target;
    },
    setOutcome(value) {
      outcome = value;
      outcomeStartedAt = performance.now();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibilityChange);
      canvas.removeEventListener("pointerdown", pointerStart);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerCancel);
      for (const mesh of meshes) gl.deleteBuffer(mesh.buffer);
      gl.deleteProgram(program);
    },
  };
}
