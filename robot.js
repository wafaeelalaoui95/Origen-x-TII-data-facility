// ============================================================
// ORIGEN A2 / G2 humanoid robot
//   - A2: bipedal, smooth silver shell, signature chest emblem (blue glow)
//   - G2: humanoid torso mounted on a wheeled mobile base (black/orange)
//   - 1.65 m tall, proper joint hierarchy so we can pose per task
//   - rounded shells via RoundedBoxGeometry / LatheGeometry / CapsuleGeometry
// ============================================================

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MATS } from "./facility-core.js";

// ---- shell materials (richer than the core's robot mats) -----------------
function getShellMats() {
  if (getShellMats._cached) return getShellMats._cached;
  const m = {
    shell:    new THREE.MeshStandardMaterial({ color: 0xdde0e5, roughness: 0.30, metalness: 0.65 }),
    shellHi:  new THREE.MeshStandardMaterial({ color: 0xeef0f3, roughness: 0.22, metalness: 0.70 }),
    shellLo:  new THREE.MeshStandardMaterial({ color: 0xa5a8ad, roughness: 0.35, metalness: 0.55 }),
    helmet:   new THREE.MeshStandardMaterial({ color: 0x121419, roughness: 0.34, metalness: 0.55 }),
    visor:    new THREE.MeshStandardMaterial({ color: 0x05070b, emissive: 0x223344, emissiveIntensity: 0.45, roughness: 0.06, metalness: 0.95 }),
    eye:      new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xfaab50, emissiveIntensity: 1.7, roughness: 0.4 }),
    joint:    new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.30, metalness: 0.85 }),
    jointDk:  new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.32, metalness: 0.85 }),
    grille:   new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.45, metalness: 0.55 }),
    chestBlue:new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x3aa3ff, emissiveIntensity: 1.0, roughness: 0.2, metalness: 0.7 }),
    chestG2:  new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff8a3a, emissiveIntensity: 1.0, roughness: 0.2, metalness: 0.7 }),
    baseBlk:  new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.5,  metalness: 0.6 }),
    baseAcc:  new THREE.MeshStandardMaterial({ color: 0xff8a3a, emissive: 0xff8a3a, emissiveIntensity: 0.5, roughness: 0.45, metalness: 0.5 }),
    tire:     new THREE.MeshStandardMaterial({ color: 0x0a0c0f, roughness: 0.95, metalness: 0.05 }),
  };
  getShellMats._cached = m;
  return m;
}

// helper
function rbox(w, h, d, r, mat, x = 0, y = h/2, z = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) * 0.45));
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cap(rA, rB, len, mat, segs = 14) {
  // tapered capsule via cylinder + spheres (capsule geometry uses single radius)
  const grp = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rA, rB, len, segs), mat);
  cyl.position.y = 0; cyl.castShadow = cyl.receiveShadow = true;
  grp.add(cyl);
  const sT = new THREE.Mesh(new THREE.SphereGeometry(rA, segs, segs), mat);
  sT.position.y =  len/2; sT.castShadow = sT.receiveShadow = true;
  const sB = new THREE.Mesh(new THREE.SphereGeometry(rB, segs, segs), mat);
  sB.position.y = -len/2; sB.castShadow = sB.receiveShadow = true;
  grp.add(sT, sB);
  return grp;
}
function cylM(r, h, mat, x = 0, y = h/2, z = 0, segs = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  return m;
}
function sphM(r, mat, x, y, z, segs = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  return m;
}

// ============================================================
// Build an arm (returns root shoulder group + handles for posing)
// shoulderGroup.position is where the shoulder lives in the parent
// Inside it, upperArm hangs down to elbow; elbowGroup is at upperArm bottom.
// ============================================================
function buildArm(side /* -1 left, +1 right */) {
  const M = getShellMats();
  const upperLen = 0.30;
  const foreLen  = 0.25;
  const shoulder = new THREE.Group();
  // shoulder ball cap (slightly outside)
  shoulder.add(sphM(0.075, M.joint, 0, 0, 0, 12));
  // outer shoulder shell pauldron (rounded)
  shoulder.add(rbox(0.13, 0.13, 0.14, 0.05, M.shellHi, side * 0.04, -0.03, 0));
  // upper arm — tapered capsule
  const up = cap(0.052, 0.048, upperLen, M.shellLo);
  up.position.y = -upperLen / 2;
  shoulder.add(up);
  // elbow joint
  const elbow = new THREE.Group();
  elbow.position.set(0, -upperLen, 0);
  elbow.add(sphM(0.055, M.jointDk, 0, 0, 0, 10));
  // forearm
  const fore = cap(0.046, 0.042, foreLen, M.shell);
  fore.position.y = -foreLen / 2;
  elbow.add(fore);
  // wrist
  const wrist = new THREE.Group();
  wrist.position.set(0, -foreLen, 0);
  wrist.add(sphM(0.045, M.jointDk, 0, 0, 0, 10));
  // hand — articulated gripper hint (palm + 2 fingers + thumb)
  const palm = rbox(0.075, 0.08, 0.04, 0.018, M.jointDk, 0, -0.05, 0);
  wrist.add(palm);
  const f1 = rbox(0.025, 0.06, 0.025, 0.008, M.joint, -0.022, -0.115, 0);
  const f2 = rbox(0.025, 0.06, 0.025, 0.008, M.joint,  0.022, -0.115, 0);
  const thumb = rbox(0.022, 0.05, 0.022, 0.008, M.joint, side * 0.04, -0.08, 0.018);
  wrist.add(f1, f2, thumb);
  elbow.add(wrist);
  shoulder.add(elbow);

  return { shoulder, elbow, wrist };
}

// ============================================================
// A2 lower body — legs
// ============================================================
function buildLegsA2() {
  const M = getShellMats();
  const g = new THREE.Group();
  const HIP = 0.85;
  for (const side of [-1, 1]) {
    const hipX = side * 0.10;
    // upper leg (rounded)
    g.add(rbox(0.18, 0.42, 0.20, 0.07, M.shellLo, hipX, HIP - 0.21, 0));
    // knee joint
    g.add(sphM(0.085, M.joint, hipX, HIP - 0.42, 0, 12));
    // lower leg (silver shin)
    g.add(rbox(0.15, 0.40, 0.16, 0.06, M.shell, hipX, HIP - 0.65, 0));
    // ankle / boot — black rounded
    g.add(rbox(0.16, 0.10, 0.22, 0.05, M.jointDk, hipX, 0.05, 0.03));
  }
  // central hip block — black
  g.add(rbox(0.32, 0.16, 0.22, 0.06, M.jointDk, 0, HIP - 0.08, 0));
  return g;
}

// ============================================================
// G2 lower body — wheeled mobile base
// (humanoid torso on a black/orange platform with visible wheels)
// ============================================================
function buildWheeledBaseG2() {
  const M = getShellMats();
  const g = new THREE.Group();
  // main lower platform — wide rounded box
  g.add(rbox(0.68, 0.42, 0.62, 0.10, M.baseBlk, 0, 0.21, 0));
  // upper hip mount — narrower, transitions to torso
  g.add(rbox(0.42, 0.30, 0.36, 0.08, M.baseBlk, 0, 0.55, 0));
  // orange accent ring around the upper hip
  g.add(rbox(0.43, 0.04, 0.37, 0.02, M.baseAcc, 0, 0.72, 0));
  // headlight / front indicator strip
  g.add(rbox(0.30, 0.04, 0.02, 0.008, M.baseAcc, 0, 0.30, 0.31));
  // wheels — two visible large wheels per side
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const z = -0.20 + i * 0.40;
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 22), M.tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.34, 0.13, z);
      wheel.castShadow = wheel.receiveShadow = true;
      g.add(wheel);
      // hubcap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.065, 14), M.shellLo);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 0.345, 0.13, z);
      hub.castShadow = hub.receiveShadow = true;
      g.add(hub);
    }
  }
  // status light
  g.add(sphM(0.018, M.eye, 0, 0.78, 0.20, 8));
  return g;
}

// ============================================================
// Build a complete humanoid: A2 or G2
// Returns root group + handles { torso, neck, head, leftArm, rightArm }
// ============================================================
export function buildRobot(variant = "A2") {
  const M = getShellMats();
  const root = new THREE.Group();
  root.userData = { kind: "robot", variant, handles: {} };
  const HIP = (variant === "G2") ? 0.85 : 0.85; // hip joint height (consistent)

  // Lower body
  const lower = (variant === "G2") ? buildWheeledBaseG2() : buildLegsA2();
  root.add(lower);

  // Upper body (rotatable for torso lean)
  const upper = new THREE.Group();
  upper.position.set(0, HIP, 0);
  root.add(upper);
  root.userData.handles.torso = upper;

  // pelvis cap
  upper.add(rbox(0.34, 0.10, 0.22, 0.05, M.jointDk, 0, 0.05, 0));
  // torso lower (narrow)
  upper.add(rbox(0.36, 0.18, 0.24, 0.07, M.shell, 0, 0.19, 0));
  // torso main — slightly tapered, signature shell shape (wider at shoulders, narrow at waist)
  const torsoMain = rbox(0.46, 0.28, 0.27, 0.10, M.shellHi, 0, 0.42, 0);
  upper.add(torsoMain);
  // dark central vent (recessed grille on chest)
  const vent = rbox(0.22, 0.16, 0.025, 0.04, M.grille, 0, 0.42, 0.13);
  upper.add(vent);
  // chest emblem (signature glowing shield) — small shape on chest
  const emblemMat = variant === "G2" ? M.chestG2 : M.chestBlue;
  const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.022, 14), emblemMat);
  emblem.position.set(0.08, 0.50, 0.146); emblem.rotation.y = 0;
  emblem.castShadow = false; upper.add(emblem);
  // chest accent strip (light bar under the emblem)
  const accent = rbox(0.20, 0.012, 0.01, 0.004, emblemMat, 0, 0.32, 0.144);
  upper.add(accent);
  // shoulder span — wider black yoke
  upper.add(rbox(0.62, 0.10, 0.22, 0.04, M.joint, 0, 0.56, 0));

  // Arms
  const leftArm = buildArm(-1);
  leftArm.shoulder.position.set(-0.31, 0.56, 0);
  upper.add(leftArm.shoulder);
  const rightArm = buildArm(+1);
  rightArm.shoulder.position.set( 0.31, 0.56, 0);
  upper.add(rightArm.shoulder);
  root.userData.handles.leftShoulder  = leftArm.shoulder;
  root.userData.handles.leftElbow     = leftArm.elbow;
  root.userData.handles.rightShoulder = rightArm.shoulder;
  root.userData.handles.rightElbow    = rightArm.elbow;

  // Neck + head
  const neck = new THREE.Group();
  neck.position.set(0, 0.62, 0); // top of torso
  upper.add(neck);
  root.userData.handles.neck = neck;
  neck.add(cylM(0.045, 0.05, M.joint, 0, 0.025, 0, 10));
  // helmet — black tapered (sloped). use a flat-topped tapered shape: rounded box stretched
  const head = new THREE.Group();
  head.position.set(0, 0.08, 0);
  neck.add(head);
  // back/top of helmet (rounded box)
  head.add(rbox(0.20, 0.20, 0.20, 0.09, M.helmet, 0, 0.06, -0.01));
  // forward sloped front (slightly smaller, slightly higher)
  const front = rbox(0.18, 0.10, 0.06, 0.025, M.shellHi, 0, 0.08, 0.09);
  head.add(front);
  // visor — wraps front, slightly curved (use a thin rounded box)
  const visor = rbox(0.21, 0.05, 0.012, 0.012, M.visor, 0, 0.06, 0.10);
  head.add(visor);
  // eye dots inside visor (yellow LED hint)
  head.add(sphM(0.011, M.eye, -0.05, 0.06, 0.106, 8));
  head.add(sphM(0.011, M.eye,  0.05, 0.06, 0.106, 8));
  // sensor pods (sides of head)
  head.add(sphM(0.028, M.jointDk, -0.105, 0.06,  0.00, 10));
  head.add(sphM(0.028, M.jointDk,  0.105, 0.06,  0.00, 10));
  // micro top sensor
  head.add(cylM(0.025, 0.025, M.jointDk, 0, 0.17, 0, 10));

  root.userData.handles.head = head;

  // safety harness loop on top of head
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.010, 6, 12), M.joint);
  loop.position.set(0, 0.20, 0); loop.rotation.x = Math.PI / 2;
  loop.castShadow = true; neck.add(loop);

  // Apply default ready pose
  applyPose(root, "ready");
  return root;
}

// ============================================================
// POSE TABLE — joint angle presets (radians)
// shoulder.rotation.x: -PI/2 = arm forward, 0 = arm down, +PI/2 = arm backward
// shoulder.rotation.z: arm rotates inward (-) / outward (+)
// elbow.rotation.x: positive bends forearm forward
// torso.rotation.x: positive leans forward
// ============================================================
export const POSES = {
  ready: { shL: [-0.18, 0, 0.10], elL: [-0.30, 0, 0], shR: [-0.18, 0, -0.10], elR: [-0.30, 0, 0], torsoX: 0 },
  reachFwd: { shL: [-1.10, 0, 0.05], elL: [-0.30, 0, 0], shR: [-1.10, 0, -0.05], elR: [-0.30, 0, 0], torsoX: 0.05 },
  reachDown: { shL: [-0.55, 0, 0.10], elL: [-0.65, 0, 0], shR: [-0.55, 0, -0.10], elR: [-0.65, 0, 0], torsoX: 0.10 },
  leanOver: { shL: [-1.00, 0, 0.15], elL: [-0.55, 0, 0], shR: [-1.00, 0, -0.15], elR: [-0.55, 0, 0], torsoX: 0.32 },
  openDoorR: { shL: [-0.20, 0, 0.10], elL: [-0.30, 0, 0], shR: [-1.10, 0, -0.05], elR: [-0.55, 0, 0], torsoX: 0.05 },
  openDoorL: { shL: [-1.10, 0, 0.05], elL: [-0.55, 0, 0], shR: [-0.20, 0, -0.10], elR: [-0.30, 0, 0], torsoX: 0.05 },
  twistHandle: { shL: [-0.20, 0, 0.10], elL: [-0.30, 0, 0], shR: [-1.15, 0, -0.10], elR: [-0.45, 0, -0.40], torsoX: 0.05 },
  liftOverhead: { shL: [-2.30, 0, 0.10], elL: [-0.30, 0, 0], shR: [-2.30, 0, -0.10], elR: [-0.30, 0, 0], torsoX: 0.0 },
  reachUp: { shL: [-1.80, 0, 0.15], elL: [-0.45, 0, 0], shR: [-1.80, 0, -0.15], elR: [-0.45, 0, 0], torsoX: -0.05 },
  carryLarge: { shL: [-1.05, 0, 0.30], elL: [-1.40, 0, 0], shR: [-1.05, 0, -0.30], elR: [-1.40, 0, 0], torsoX: 0.10 },
  assembly: { shL: [-0.95, 0, 0.20], elL: [-1.25, 0, 0], shR: [-0.95, 0, -0.20], elR: [-1.25, 0, 0], torsoX: 0.18 },
  typeTablet: { shL: [-0.55, 0, 0.30], elL: [-1.55, 0, 0], shR: [-0.55, 0, -0.30], elR: [-1.55, 0, 0], torsoX: 0.10 },
  getUp: { shL: [-1.20, 0, 0.30], elL: [-1.00, 0, 0], shR: [-1.20, 0, -0.30], elR: [-1.00, 0, 0], torsoX: 0.45 },
  wipeSurface: { shL: [-0.25, 0, 0.10], elL: [-0.30, 0, 0], shR: [-1.20, 0, -0.10], elR: [-0.50, 0, 0.20], torsoX: 0.10 },
  pushPanel:  { shL: [-1.30, 0, 0.20], elL: [-0.40, 0, 0], shR: [-1.30, 0, -0.20], elR: [-0.40, 0, 0], torsoX: 0.18 },
};

export function applyPose(robot, name) {
  const p = POSES[name] || POSES.ready;
  const h = robot.userData.handles;
  if (!h) return;
  h.leftShoulder.rotation.set(p.shL[0], p.shL[1], p.shL[2]);
  h.leftElbow.rotation.set(p.elL[0], p.elL[1], p.elL[2]);
  h.rightShoulder.rotation.set(p.shR[0], p.shR[1], p.shR[2]);
  h.rightElbow.rotation.set(p.elR[0], p.elR[1], p.elR[2]);
  h.torso.rotation.set(p.torsoX || 0, 0, 0);
  robot.userData.pose = name;
}

// ============================================================
// STATION_STAGING — per-kind robot placement + pose
// Coordinates are relative to station center.
// pos: [x, z] in metres. ry: rotation around Y in radians.
// pose: name in POSES table.
// ============================================================
export const STATION_STAGING = {
  // STANDARD — robot stands at +Z side, facing -Z with clear space between body and bench.
  "std-pick":      { pos: [ 0.10, 1.18], ry: Math.PI, pose: "assembly" },
  "std-insert":    { pos: [ 0.00, 1.18], ry: Math.PI, pose: "assembly" },
  "std-closeopen": { pos: [-0.25, 1.18], ry: Math.PI, pose: "openDoorR" },
  "std-turn":      { pos: [ 0.05, 1.18], ry: Math.PI, pose: "twistHandle" },
  "std-pushpull":  { pos: [ 0.10, 1.18], ry: Math.PI, pose: "reachFwd" },
  "std-lift":      { pos: [-0.10, 1.08], ry: Math.PI, pose: "reachDown" },
  "std-wipe":      { pos: [-0.10, 1.18], ry: Math.PI, pose: "wipeSurface" },

  // F&B
  "fb-fry":        { pos: [-0.10, 1.18], ry: Math.PI, pose: "reachFwd" },
  "fb-pizza":      { pos: [-0.10, 1.18], ry: Math.PI, pose: "assembly" },
  "fb-sandwich":   { pos: [ 0.00, 1.18], ry: Math.PI, pose: "assembly" },

  // HOME
  "home-fold":     { pos: [ 0.00, 1.18], ry: Math.PI, pose: "assembly" },
  "home-counter":  { pos: [ 0.10, 1.20], ry: Math.PI, pose: "reachFwd" },
  "home-dishrack": { pos: [ 0.00, 1.22], ry: Math.PI, pose: "leanOver" },
  "home-drawers":  { pos: [ 0.00, 1.20], ry: Math.PI, pose: "openDoorR" },
  "home-fridge":   { pos: [ 1.02, 1.00], ry: -2.55, pose: "openDoorL" },
  "home-drum":     { pos: [ 0.00, 1.22], ry: Math.PI, pose: "leanOver" },
  // bed sits along Z axis at -X; stand on its RIGHT (positive X) facing the bed (-X)
  "home-bed":      { pos: [ 0.55, 0.10], ry: -Math.PI / 2, pose: "leanOver" },
  "home-washdish": { pos: [ 0.00, 1.20], ry: Math.PI, pose: "reachFwd" },

  // LOGISTICS — G2 wheeled
  "log-conveyor":  { pos: [-0.20, 1.12], ry: Math.PI, pose: "reachFwd" },
  "log-pack":      { pos: [ 0.00, 1.18], ry: Math.PI, pose: "assembly" },
  "log-shelf":     { pos: [ 0.00, 1.18], ry: Math.PI, pose: "reachUp" },

  // SECURITY
  "sec-access":    { pos: [ 0.20, 1.18], ry: Math.PI, pose: "typeTablet" },
  "sec-handle":    { pos: [-0.40, 1.10], ry: Math.PI, pose: "openDoorR" },
  "sec-heavy":     { pos: [ 0.10, 1.18], ry: Math.PI, pose: "pushPanel" },

  // MOBILITY — A2 biped
  // stairs go from -d*0.30 (base) toward +Z; robot at base of stairs facing +Z
  "mob-steps":     { pos: [-0.50,-1.10], ry: 0,           pose: "getUp" },
  // high shelf is at +X; robot facing +X reaching up
  "mob-multi":     { pos: [ 0.20, 0.00], ry: Math.PI / 2, pose: "reachUp" },
  // large box on the floor at -X; robot in front of it, picking up
  "mob-bimanual":  { pos: [-0.45, 0.50], ry: Math.PI,     pose: "carryLarge" },
};

// ============================================================
// Idle micro-animation: subtle head bob + breath chest + small head yaw drift
// Call each frame: animateRobotIdle(robot, t, lookAtLocalDir?)
// ============================================================
export function animateRobotIdle(robot, t, phase = 0) {
  const h = robot.userData.handles;
  if (!h) return;
  // breathing on torso (very subtle scale y)
  const br = 1 + Math.sin(t * 1.3 + phase) * 0.005;
  h.torso.scale.y = br;
  // head yaw drift — small left-right with random offset
  if (h.head) {
    const baseY = robot.userData.headBaseY ?? 0;
    h.head.rotation.y = baseY + Math.sin(t * 0.45 + phase) * 0.10;
    h.head.rotation.x = (robot.userData.headBaseX ?? 0) + Math.sin(t * 0.7 + phase) * 0.04;
  }
}

// ============================================================
// Make head look toward a world point (called at build time so it remains anchored).
// ============================================================
export function aimHeadAt(robot, worldTargetVec3) {
  const h = robot.userData.handles;
  if (!h || !h.head) return;
  // local position of target relative to head
  const headWorldPos = new THREE.Vector3();
  h.head.getWorldPosition(headWorldPos);
  const dir = new THREE.Vector3().subVectors(worldTargetVec3, headWorldPos);
  // express direction in robot-root local frame
  const inv = new THREE.Matrix4().copy(robot.matrixWorld).invert();
  dir.transformDirection(inv);
  // yaw + pitch (subtle so head doesn't fully rotate)
  const yaw = Math.atan2(dir.x, dir.z + 0.001);
  const pitch = -Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
  h.head.rotation.y = Math.max(-0.5, Math.min(0.5, yaw));
  h.head.rotation.x = Math.max(-0.35, Math.min(0.35, pitch));
  robot.userData.headBaseY = h.head.rotation.y;
  robot.userData.headBaseX = h.head.rotation.x;
}
