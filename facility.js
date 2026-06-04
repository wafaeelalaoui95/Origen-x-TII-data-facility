// ============================================================
// ORIGEN Facility — Orchestrator (2 floors + service core)
// ============================================================

import * as THREE from "three";
import { STATIONS, CATEGORIES } from "./stations.js";
import {
  MATS, buildMaterials, box, cyl, sph,
  makeOperator, makeSeatedOperator,
  makeStationGantry, makeDataTerminal, makeHazardTape,
} from "./facility-core.js";
import { KIND_BUILDERS } from "./facility-equip.js";
import { buildRobot, applyPose, STATION_STAGING, aimHeadAt } from "./robot.js";
import {
  BUILDING, FLOOR_H, WALL_H,
  stationPlacement, getSupportPlacement, getCoreRooms, getStationZoneLabels,
} from "./layout.js";

export { MATS, buildMaterials, FLOOR_H };
export { getStationZoneLabels };

function faceAt(object, tx, tz) { object.rotation.y = Math.atan2(tx - object.position.x, tz - object.position.z); }

export function stationCenter(s) {
  const p = stationPlacement(s.id);
  return { x: p.x, z: p.z, w: p.w, d: p.d, y: 0 };
}

// ============================================================
// Robot + operator staging within a cell (1 or 2 robots)
// ============================================================
function robotLayouts(s, w, d) {
  if (s.robots <= 1) {
    const st = STATION_STAGING[s.kind] || { pos: [0, d * 0.28], ry: Math.PI, pose: "ready" };
    return [st];
  }
  switch (s.kind) {
    case "loco-door":   return [{ pos: [-w * 0.20, d * 0.20], ry: Math.PI, pose: "openDoorR" }, { pos: [w * 0.18, d * 0.20], ry: Math.PI, pose: "pushPanel" }];
    case "mob-multi":   return [{ pos: [w * 0.02, -d * 0.04], ry: Math.PI / 2, pose: "reachUp" }, { pos: [-w * 0.14, d * 0.22], ry: Math.PI, pose: "reachDown" }];
    case "mob-bimanual":return [{ pos: [-w * 0.10 - 0.55, d * 0.14], ry: Math.PI, pose: "carryLarge" }, { pos: [-w * 0.10 + 0.55, d * 0.14], ry: Math.PI, pose: "carryLarge" }];
    default:            return [{ pos: [-w * 0.18, d * 0.20], ry: Math.PI, pose: "ready" }, { pos: [w * 0.18, d * 0.20], ry: Math.PI, pose: "ready" }];
  }
}
function operatorSpots(count, w, d) {
  if (count <= 1) return [{ x: -w * 0.36, z: d * 0.34 }];
  return [{ x: -w * 0.34, z: d * 0.34 }, { x: w * 0.34, z: d * 0.34 }];
}

// ============================================================
// Build a single station cell
// ============================================================
export function buildStation(s) {
  const root = new THREE.Group();
  const { x, z, w, d } = stationCenter(s);
  root.position.set(x, 0, z);
  root.userData = { station: s, type: "station" };

  const tint = CATEGORIES[s.category].floor;
  const floorMat = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.55, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.014, d - 0.04), floorMat);
  floor.position.y = 0.012; floor.receiveShadow = true;
  root.add(floor);
  root.add(makeHazardTape(w, d));

  const stripeMat = new THREE.MeshStandardMaterial({ color: CATEGORIES[s.category].color, emissive: CATEGORIES[s.category].color, emissiveIntensity: 0.25, roughness: 0.5, metalness: 0.2 });
  root.add(box(w - 0.5, 0.012, 0.05, stripeMat, 0, 0.02, -d / 2 + 0.12));

  const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: CATEGORIES[s.category].color, emissiveIntensity: 1.0, transparent: true, opacity: 0.0, roughness: 0.4, metalness: 0.0 });
  const ring = new THREE.Mesh(new THREE.BoxGeometry(w - 0.10, 0.005, d - 0.10), ringMat);
  ring.position.y = 0.026; ring.userData.highlight = true;
  root.add(ring);
  root.userData.ringMat = ringMat;

  const gantry = makeStationGantry(w, d);
  root.add(gantry);
  root.userData.gantry = gantry;

  const builder = KIND_BUILDERS[s.kind];
  if (builder) root.add(builder(w, d));

  const layouts = robotLayouts(s, w, d);
  const robots = [];
  for (const L of layouts) {
    const robot = buildRobot(s.robot);
    robot.position.set(L.pos[0], 0, L.pos[1]);
    robot.rotation.y = L.ry;
    applyPose(robot, L.pose);
    robot.userData.detailShade = true;
    root.add(robot);
    robots.push(robot);
  }

  const spots = operatorSpots(s.operators, w, d);
  spots.forEach((sp, i) => {
    const op = makeOperator();
    op.position.set(sp.x, 0, sp.z);
    const tgt = robots[Math.min(i, robots.length - 1)];
    faceAt(op, tgt.position.x, tgt.position.z);
    op.userData.detailShade = true;
    root.add(op);
    const term = makeDataTerminal();
    term.position.set(sp.x + (sp.x < 0 ? -0.08 : 0.08), 0, sp.z - 0.06);
    term.rotation.y = sp.x < 0 ? 0.6 : -0.6;
    root.add(term);
  });

  root.updateMatrixWorld(true);
  for (const robot of robots) {
    let ty = 1.0;
    if (s.kind === "mob-multi" || s.kind === "log-shelf") ty = 1.7;
    aimHeadAt(robot, new THREE.Vector3(x, ty, z - d * 0.06));
  }

  floor.userData.pickTarget = root;
  ring.userData.pickTarget = root;
  root.userData.pickables = [floor, ring];
  return root;
}

// ============================================================
// Per-floor shell — perimeter walls + core/ops divider + columns
// Built in local coords with walking surface at y = 0.
// ============================================================
export function buildShellFloor(floorIndex) {
  const g = new THREE.Group();
  const { totalW, totalD, interiorW, interiorD, wallT, dividerX } = BUILDING;

  g.add(box(totalW, 0.30, totalD, MATS.concreteDark, 0, -0.16, 0));
  const finish = new THREE.Mesh(new THREE.BoxGeometry(interiorW, 0.04, interiorD),
    floorIndex === 0 ? MATS.concrete : new THREE.MeshStandardMaterial({ color: 0x8f9298, roughness: 0.5, metalness: 0.06 }));
  finish.position.y = 0.0; finish.receiveShadow = true;
  g.add(finish);

  const halfW = totalW / 2, halfD = totalD / 2;
  const wN = box(totalW, WALL_H, wallT, MATS.wallWhite, 0, WALL_H / 2, -halfD + wallT / 2);
  const wS = box(totalW, WALL_H, wallT, MATS.wallWhite, 0, WALL_H / 2, halfD - wallT / 2);
  const wW = box(wallT, WALL_H, totalD, MATS.wallWhite, -halfW + wallT / 2, WALL_H / 2, 0);
  const wE = box(wallT, WALL_H, totalD, MATS.wallWhite, halfW - wallT / 2, WALL_H / 2, 0);
  g.add(wN, wS, wW, wE);
  g.add(box(totalW, 0.09, wallT * 1.2, MATS.wallTrim, 0, WALL_H - 0.04, -halfD + wallT / 2));
  g.add(box(totalW, 0.09, wallT * 1.2, MATS.wallTrim, 0, WALL_H - 0.04, halfD - wallT / 2));
  g.add(box(wallT * 1.2, 0.09, totalD, MATS.wallTrim, -halfW + wallT / 2, WALL_H - 0.04, 0));
  g.add(box(wallT * 1.2, 0.09, totalD, MATS.wallTrim, halfW - wallT / 2, WALL_H - 0.04, 0));

  // core / ops divider wall with a central corridor opening
  const gap = 2.4, segD = (interiorD - gap) / 2;
  for (const s of [-1, 1]) {
    g.add(box(0.16, WALL_H, segD, MATS.partition, dividerX, WALL_H / 2, s * (gap / 2 + segD / 2)));
    g.add(box(0.18, 0.06, segD, MATS.partitionEdge, dividerX, WALL_H - 0.02, s * (gap / 2 + segD / 2)));
  }

  // structural columns in the ops block
  const colXs = [BUILDING.mainCx - BUILDING.mainW * 0.3, BUILDING.mainCx + BUILDING.mainW * 0.3];
  for (const cx of colXs) for (const cz of [-interiorD * 0.28, interiorD * 0.28]) {
    g.add(box(0.42, WALL_H, 0.42, MATS.wallWhite, cx, WALL_H / 2, cz));
  }

  // lighting truss
  const trussY = WALL_H + 0.4;
  for (let i = 0; i < 6; i++) {
    const lx = -halfW + (i + 0.5) * (totalW / 6);
    g.add(box(0.08, 0.08, totalD - 1.0, MATS.gantry, lx, trussY, 0));
    g.add(box(0.08, 0.04, 2.2, MATS.ledStrip, lx, trussY - 0.08, 0));
    g.add(box(0.08, 0.04, 2.2, MATS.ledStrip, lx, trussY - 0.08, -totalD * 0.30));
    g.add(box(0.08, 0.04, 2.2, MATS.ledStrip, lx, trussY - 0.08, totalD * 0.30));
  }
  g.userData = { type: "shell", floorIndex };
  return g;
}

// ============================================================
// SITE — ground + landscaping (shared, always visible)
// ============================================================
export function buildSite() {
  const g = new THREE.Group();
  const { totalW, totalD } = BUILDING;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(totalW + 80, totalD + 80), MATS.outerGround);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.34; ground.receiveShadow = true;
  g.add(ground);
  for (let i = 0; i < 22; i++) {
    const tx = (Math.random() - 0.5) * (totalW + 64), tz = (Math.random() - 0.5) * (totalD + 64);
    if (Math.abs(tx) < totalW / 2 + 4 && Math.abs(tz) < totalD / 2 + 4) continue;
    g.add(cyl(0.10, 0.6, MATS.wallTrim, tx, 0.30 - 0.34, tz, 8));
    g.add(sph(0.65 + Math.random() * 0.4, MATS.greenery, tx, 1.10 - 0.34, tz, 10));
  }
  for (let i = 0; i < 6; i++) {
    const x = -totalW / 2 + 3 + i * (totalW - 6) / 5, z = totalD / 2 + 1.4;
    g.add(box(2.0, 0.4, 0.6, MATS.wallTrim, x, 0.20 - 0.34, z));
    g.add(box(1.9, 0.25, 0.5, MATS.greenery, x, 0.50 - 0.34, z));
  }
  return g;
}

// ============================================================
// Partitioned room helper
// ============================================================
function roomWalls(g, cx, cz, w, d, doorSide, H = 2.4) {
  const T = 0.10, gap = 1.2, mat = MATS.partition;
  const hw = w / 2, hd = d / 2;
  const seg = (len) => (len - gap) / 2;
  // N (-z) & S (+z)
  for (const side of [-1, 1]) {
    const isDoor = (side === -1 && doorSide === "N") || (side === 1 && doorSide === "S");
    if (isDoor) { const s2 = seg(w); g.add(box(s2, H, T, mat, cx - (gap / 2 + s2 / 2), H / 2, cz + side * hd)); g.add(box(s2, H, T, mat, cx + (gap / 2 + s2 / 2), H / 2, cz + side * hd)); }
    else g.add(box(w, H, T, mat, cx, H / 2, cz + side * hd));
    g.add(box(w, 0.05, T * 1.3, MATS.partitionEdge, cx, H - 0.02, cz + side * hd));
  }
  // W (-x) & E (+x)
  for (const side of [-1, 1]) {
    const isDoor = (side === -1 && doorSide === "W") || (side === 1 && doorSide === "E");
    if (isDoor) { const s2 = seg(d); g.add(box(T, H, s2, mat, cx + side * hw, H / 2, cz - (gap / 2 + s2 / 2))); g.add(box(T, H, s2, mat, cx + side * hw, H / 2, cz + (gap / 2 + s2 / 2))); }
    else g.add(box(T, H, d, mat, cx + side * hw, H / 2, cz));
    g.add(box(T * 1.3, 0.05, d, MATS.partitionEdge, cx + side * hw, H - 0.02, cz));
  }
}

// ============================================================
// Support areas (ops block)
// ============================================================
function fillAnnotation(g, z) {
  // single row of 5 desks (annotators + support staff) + seated people
  const cx = z.cx, cz = z.cz, n = 5;
  g.add(box(z.w * 0.9, 0.74, 0.66, MATS.steelDark, cx, 0.37, cz - 0.1));
  g.add(box(z.w * 0.9, 0.04, 0.68, MATS.tabletop, cx, 0.76, cz - 0.1));
  for (let i = 0; i < n; i++) {
    const sx = cx - z.w * 0.36 + i * (z.w * 0.72 / (n - 1));
    g.add(box(0.42, 0.28, 0.03, MATS.screen, sx, 1.06, cz - 0.28));
    g.add(box(0.06, 0.22, 0.06, MATS.equipDark, sx, 0.90, cz - 0.28));
    g.add(box(0.46, 0.05, 0.46, MATS.equipDark, sx, 0.45, cz + 0.34));
    g.add(box(0.46, 0.5, 0.05, MATS.equipDark, sx, 0.72, cz + 0.52));
    const op = makeSeatedOperator(); op.position.set(sx, 0, cz + 0.26); op.rotation.y = 0; g.add(op);
  }
}
function fillOffice(g, z) {
  const cx = z.cx, cz = z.cz;
  for (const s of [-1, 1]) {
    g.add(box(z.w * 0.52, 0.74, 0.58, MATS.steelDark, cx, 0.37, cz + s * z.d * 0.18));
    g.add(box(z.w * 0.52, 0.04, 0.60, MATS.tabletop, cx, 0.76, cz + s * z.d * 0.18));
    g.add(box(0.36, 0.24, 0.03, MATS.screen, cx, 1.0, cz + s * (z.d * 0.18 - 0.16)));
    g.add(box(0.46, 0.05, 0.46, MATS.equipDark, cx + 0.1, 0.45, cz + s * (z.d * 0.18 + 0.5)));
    g.add(box(0.46, 0.5, 0.05, MATS.equipDark, cx + 0.1, 0.72, cz + s * (z.d * 0.18 + 0.68)));
  }
  g.add(box(z.w * 0.7, 1.4, 0.32, MATS.wood, cx, 0.7, cz - z.d * 0.40));
}
function fillServer(g, z) {
  const cx = z.cx, cz = z.cz;
  g.add(box(z.w * 0.95, 0.02, z.d * 0.95, new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.6 }), cx, 0.012, cz));
  for (let c = 0; c < 2; c++) for (let i = 0; i < 3; i++) {
    const rx = cx - z.w * 0.18 + c * (z.w * 0.36), rz = cz - z.d * 0.28 + i * (z.d * 0.28);
    g.add(box(0.62, 1.9, 0.78, MATS.serverRack, rx, 0.95, rz));
    for (let b = 0; b < 8; b++) {
      const bm = new THREE.MeshStandardMaterial({ color: 0x05080a, emissive: 0x2a8eff, emissiveIntensity: 0.4 + Math.random() * 0.6, roughness: 0.4 });
      g.add(box(0.44, 0.04, 0.03, bm, rx, 0.42 + b * 0.16, rz + 0.39));
    }
  }
}
function fillSpares(g, z) {
  const cx = z.cx, cz = z.cz;
  const bayX = cx - z.w * 0.30;
  for (let lvl = 0; lvl < 4; lvl++) {
    g.add(box(z.w * 0.5, 0.04, 0.5, MATS.steel, bayX, 0.4 + lvl * 0.55, cz - z.d * 0.30));
    for (let i = 0; i < 4; i++) {
      const c = [MATS.boxKraft, MATS.crateGreen, MATS.crateBlue][(i + lvl) % 3];
      g.add(box(0.26, 0.22, 0.30, c, bayX - z.w * 0.18 + i * (z.w * 0.12), 0.55 + lvl * 0.55, cz - z.d * 0.30));
    }
  }
  const docks = [{ v: "A2", x: cx + z.w * 0.06 }, { v: "A2", x: cx + z.w * 0.22 }, { v: "G2", x: cx + z.w * 0.38 }];
  for (const dk of docks) {
    const dz = cz + z.d * 0.22;
    g.add(box(0.7, 0.04, 0.7, MATS.concreteDark, dk.x, 0.02, dz));
    g.add(box(0.7, 1.4, 0.08, MATS.equipDark, dk.x, 0.7, dz - 0.34));
    g.add(box(0.5, 0.08, 0.04, MATS.gantryBlue, dk.x, 1.2, dz - 0.30));
    const r = buildRobot(dk.v); r.position.set(dk.x, 0, dz); r.rotation.y = Math.PI; applyPose(r, "ready"); g.add(r);
  }
}

const SUPPORT_FILLERS = { support1: fillAnnotation, support2: fillAnnotation, office: fillOffice, server: fillServer, spares: fillSpares };
const SUPPORT_TINTS = { support1: 0x20242c, support2: 0x20242c, office: 0x222730, server: 0x14171d, spares: 0x201d18 };

export function buildSupportRooms(floor) {
  const g = new THREE.Group();
  for (const z of getSupportPlacement(floor)) {
    if (z.enclosed) {
      // enclosed room (server) — tinted floor + partition walls, door toward the open area
      g.add(box(z.w - 0.08, 0.02, z.d - 0.08, new THREE.MeshStandardMaterial({ color: SUPPORT_TINTS[z.key] ?? 0x14171d, roughness: 0.6, metalness: 0.04 }), z.cx, 0.012, z.cz));
      roomWalls(g, z.cx, z.cz, z.w, z.d, "W", 2.6);
    } else {
      // open zone — faint floor pad only, no partitions
      g.add(box(z.w - 0.2, 0.016, z.d - 0.2, new THREE.MeshStandardMaterial({ color: SUPPORT_TINTS[z.key] ?? 0x20242c, roughness: 0.62, metalness: 0.03 }), z.cx, 0.009, z.cz));
    }
    SUPPORT_FILLERS[z.key]?.(g, z);
  }
  g.userData = { type: "supportRooms", floor };
  return g;
}

// ============================================================
// Service core rooms (washrooms · service · pantry · lift lobby)
// ============================================================
function fillWashrooms(g, z) {
  const cx = z.cx, cz = z.cz, n = 3;
  for (let i = 0; i < n; i++) {
    const sz = cz - z.d * 0.28 + i * (z.d * 0.56 / (n - 1));
    g.add(box(z.w * 0.5, 1.9, 0.06, MATS.partition, cx - z.w * 0.02, 0.95, sz)); // stall divider
    g.add(box(0.34, 0.42, 0.36, MATS.tabletop, cx - z.w * 0.26, 0.21, sz));       // toilet
  }
  // sink counter on the ops-facing side
  g.add(box(0.4, 0.85, z.d * 0.7, MATS.steelDark, cx + z.w * 0.34, 0.42, cz));
  g.add(box(0.42, 0.04, z.d * 0.7, MATS.tabletop, cx + z.w * 0.34, 0.86, cz));
  for (let i = 0; i < 3; i++) {
    const sz = cz - z.d * 0.24 + i * (z.d * 0.24);
    g.add(box(0.24, 0.10, 0.26, MATS.tabletop, cx + z.w * 0.34, 0.86, sz));
    g.add(box(0.03, 0.7, 0.5, MATS.glass, cx + z.w * 0.34 + 0.18, 1.35, sz));
  }
}
function fillService(g, z) {
  const cx = z.cx, cz = z.cz;
  // store / electrical / telecom cabinets along the back wall
  for (let i = 0; i < 4; i++) {
    const sz = cz - z.d * 0.32 + i * (z.d * 0.64 / 3);
    g.add(box(z.w * 0.34, 1.7, 0.4, MATS.serverRack, cx - z.w * 0.26, 0.85, sz));
    g.add(box(z.w * 0.30, 0.06, 0.04, MATS.gantryBlue, cx - z.w * 0.26, 1.5, sz + 0.21));
  }
  g.add(box(z.w * 0.5, 1.0, 0.5, MATS.equipDark, cx + z.w * 0.2, 0.5, cz)); // store crates
}
function fillPantry(g, z) {
  const cx = z.cx, cz = z.cz;
  g.add(box(z.w * 0.7, 0.9, 0.5, MATS.wood, cx - z.w * 0.1, 0.45, cz - z.d * 0.30));
  g.add(box(z.w * 0.7, 0.04, 0.52, MATS.tabletop, cx - z.w * 0.1, 0.92, cz - z.d * 0.30));
  g.add(box(0.4, 0.14, 0.34, MATS.steelDark, cx - z.w * 0.26, 0.88, cz - z.d * 0.30));   // sink
  g.add(box(0.26, 0.36, 0.26, MATS.steel, cx + z.w * 0.06, 1.10, cz - z.d * 0.30));        // microwave
  g.add(box(0.5, 1.6, 0.5, MATS.steel, cx + z.w * 0.24, 0.8, cz - z.d * 0.26));            // fridge
  g.add(cyl(z.w * 0.14, 0.74, MATS.steelDark, cx, 0.37, cz + z.d * 0.16, 18));
  g.add(cyl(z.w * 0.18, 0.04, MATS.tabletop, cx, 0.76, cz + z.d * 0.16, 20));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; g.add(cyl(0.15, 0.46, MATS.equipDark, cx + Math.cos(a) * z.w * 0.26, 0.23, cz + z.d * 0.16 + Math.sin(a) * z.d * 0.18, 14)); }
}
function fillLift(g, z) {
  const cx = z.cx, cz = z.cz;
  // 3 elevator doors on the ops-facing side
  for (let i = 0; i < 3; i++) {
    const sz = cz - z.d * 0.26 + i * (z.d * 0.52 / 2);
    g.add(box(0.16, 2.2, 0.9, MATS.steelDark, cx + z.w * 0.30, 1.1, sz));
    g.add(box(0.04, 2.0, 0.76, MATS.steel, cx + z.w * 0.30 + 0.09, 1.0, sz));
    g.add(box(0.04, 2.0, 0.02, MATS.gantryBlue, cx + z.w * 0.30 + 0.11, 1.0, sz)); // door seam
  }
  // stair flight (zigzag) on the far side
  for (let i = 0; i < 6; i++) {
    const h = 0.18 * (i + 1);
    g.add(box(z.w * 0.4, h, 0.30, MATS.concreteDark, cx - z.w * 0.22, h / 2, cz - z.d * 0.30 + i * 0.32));
  }
  g.add(box(0.05, 1.0, z.d * 0.5, MATS.steel, cx - z.w * 0.02, 1.0, cz)); // handrail
}

const CORE_FILLERS = { washrooms: fillWashrooms, service: fillService, pantry: fillPantry, lift: fillLift };
const CORE_TINTS = { washrooms: 0x202730, service: 0x1a1d23, pantry: 0x242019, lift: 0x1d2026 };

export function buildCore(floor) {
  const g = new THREE.Group();
  for (const z of getCoreRooms()) {
    g.add(box(z.w - 0.08, 0.02, z.d - 0.08, new THREE.MeshStandardMaterial({ color: CORE_TINTS[z.key] ?? 0x1d2026, roughness: 0.6 }), z.cx, 0.012, z.cz));
    roomWalls(g, z.cx, z.cz, z.w, z.d, "E", 2.5);
    CORE_FILLERS[z.key]?.(g, z);
  }
  g.userData = { type: "core", floor };
  return g;
}

// ---- label position helpers (XZ; main.js adds floor Y) ----
export function getSupportZoneLabels(floor) { return getSupportPlacement(floor).map((z) => ({ id: z.key, label: z.label, x: z.cx, z: z.cz })); }
export function getCoreZoneLabels(floor) { return getCoreRooms().map((z) => ({ id: z.key, label: z.label, x: z.cx, z: z.cz })); }

// ============================================================
// Wandering humans on a floor's ops block
// ============================================================
export function buildWanderers() {
  const g = new THREE.Group();
  const { mainCx, mainW, interiorD } = BUILDING;
  for (let i = 0; i < 5; i++) {
    const op = makeOperator();
    op.position.set(mainCx + (Math.random() - 0.5) * mainW * 0.8, 0, (Math.random() - 0.5) * interiorD * 0.7);
    op.rotation.y = Math.random() * Math.PI * 2;
    op.userData.detailShade = true;
    g.add(op);
  }
  return g;
}
