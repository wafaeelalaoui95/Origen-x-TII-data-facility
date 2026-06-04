// ============================================================
// ORIGEN Facility — Orchestrator: floor plan, station builder, shell, operator area, server room
// ============================================================

import * as THREE from "three";
import { STATIONS, CATEGORIES, LAYOUT } from "./stations.js";
import {
  MATS, buildMaterials, box, cyl, sph,
  makeHumanoid, makeOperator, makeSeatedOperator,
  makeStationGantry, makeDataTerminal, makeHazardTape,
} from "./facility-core.js";
import { KIND_BUILDERS } from "./facility-equip.js";
import { buildRobot, applyPose, STATION_STAGING, aimHeadAt } from "./robot.js";

export { MATS, buildMaterials };

function faceModeledFrontAt(object, target) {
  const dx = target.x - object.position.x;
  const dz = target.z - object.position.z;
  object.rotation.y = Math.atan2(dx, dz);
}

// ============================================================
// Floor plan
// ============================================================
export function getFloorPlan() {
  const { cols, rows, cell, gap, margin, sideStrip } = LAYOUT;
  const gridW = cols * cell.w + (cols - 1) * gap;
  const gridD = rows * cell.d + (rows - 1) * gap;
  const totalW = sideStrip + 1.5 + gridW + margin * 2;
  const totalD = gridD + margin * 2;
  const origin = { x: -totalW / 2, z: -totalD / 2 };
  const gridX0 = origin.x + margin + sideStrip + 1.5;
  const gridZ0 = origin.z + margin;
  return { gridW, gridD, totalW, totalD, origin, gridX0, gridZ0, sideStrip };
}

export function stationCenter(idx /* 0..47 */) {
  const fp = getFloorPlan();
  const { cols, cell, gap } = LAYOUT;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = fp.gridX0 + col * (cell.w + gap) + cell.w / 2;
  const cz = fp.gridZ0 + row * (cell.d + gap) + cell.d / 2;
  return { x: cx, z: cz, w: cell.w, d: cell.d };
}

// ============================================================
// Build a single station — open-plan, no walls,
// equipment + robot + operator + data terminal + overhead gantry + hazard tape
// ============================================================
export function buildStation(s, idx) {
  const root = new THREE.Group();
  const { x, z, w, d } = stationCenter(idx);
  root.position.set(x, 0, z);
  root.userData = { station: s, idx, type: "station" };

  // floor patch — pale category tint
  const tint = CATEGORIES[s.category].floor;
  const floorMat = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.55, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.014, d - 0.04), floorMat);
  floor.position.y = 0.008; floor.receiveShadow = true;
  root.add(floor);

  // hazard tape border (yellow/black)
  root.add(makeHazardTape(w, d));

  // category color stripe along ONE long edge (subtle inline marker)
  const stripe = new THREE.MeshStandardMaterial({
    color: CATEGORIES[s.category].color, emissive: CATEGORIES[s.category].color, emissiveIntensity: 0.25,
    roughness: 0.5, metalness: 0.2,
  });
  root.add(box(w - 0.5, 0.012, 0.05, stripe, 0, 0.018, -d/2 + 0.10));

  // hover highlight ring (initially invisible)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: CATEGORIES[s.category].color, emissiveIntensity: 1.0,
    transparent: true, opacity: 0.0, roughness: 0.4, metalness: 0.0,
  });
  const ring = new THREE.Mesh(new THREE.BoxGeometry(w - 0.10, 0.005, d - 0.10), ringMat);
  ring.position.y = 0.022;
  ring.userData.highlight = true;
  root.add(ring);
  root.userData.ringMat = ringMat;

  // overhead gantry (kept separate so we can fade it if needed)
  const gantry = makeStationGantry(w, d);
  root.add(gantry);
  root.userData.gantry = gantry;

  // equipment
  const builder = KIND_BUILDERS[s.kind];
  if (builder) {
    const eq = builder(w, d);
    root.add(eq);
  }

  // robot — new pose-aware build (1.65 m, rounded shell, A2 biped or G2 wheeled)
  const stage = STATION_STAGING[s.kind] || { pos: [0, 0.4], ry: Math.PI, pose: "ready" };
  const robot = buildRobot(s.robot);
  robot.position.set(stage.pos[0], 0, stage.pos[1]);
  robot.rotation.y = stage.ry;
  applyPose(robot, stage.pose);
  robot.userData.detailShade = true;
  root.add(robot);

  // operator: VR teleop, stands at the front-left of every station near the data terminal
  const op = makeOperator();
  op.position.set(-w * 0.34, 0, d * 0.38);
  faceModeledFrontAt(op, robot.position);
  op.userData.detailShade = true;
  root.add(op);

  // data terminal — beside the operator, slightly further back
  const term = makeDataTerminal();
  term.position.set(-w * 0.42, 0, d * 0.32);
  term.rotation.y = 0.6;
  root.add(term);

  // aim robot's head toward the equipment center (approx world target)
  root.updateMatrixWorld(true);
  const eqWorld = new THREE.Vector3(x, 1.0, z - d * 0.10);
  // for home-bed: equipment is to the LEFT of the robot
  if (s.kind === "home-bed") eqWorld.set(x - w * 0.10, 0.5, z);
  if (s.kind === "mob-steps") eqWorld.set(x - w * 0.10, 1.2, z + d * 0.0);
  if (s.kind === "mob-multi") eqWorld.set(x + w * 0.25, 1.9, z - d * 0.05);
  if (s.kind === "mob-bimanual") eqWorld.set(x - w * 0.10, 0.4, z);
  aimHeadAt(robot, eqWorld);

  // pickable
  floor.userData.pickTarget = root;
  ring.userData.pickTarget = root;
  root.userData.pickables = [floor, ring];

  return root;
}

// ============================================================
// Operator area — long ops desk on the left side of facility,
// with monitors and seated operators (reception strip)
// ============================================================
export function buildOperatorArea() {
  const g = new THREE.Group();
  const fp = getFloorPlan();
  const stripX = fp.origin.x + LAYOUT.margin + fp.sideStrip / 2 - 0.5;
  const stripZ0 = fp.origin.z + LAYOUT.margin;
  const stripD = fp.gridD * 0.55;

  // desk
  g.add(box(2.2, 0.74, stripD, MATS.steelDark, stripX, 0.37, stripZ0 + stripD / 2));
  g.add(box(2.2, 0.04, stripD, MATS.tabletop,  stripX, 0.76, stripZ0 + stripD / 2));

  const n = 7;
  for (let i = 0; i < n; i++) {
    const z = stripZ0 + (i + 0.5) * (stripD / n);
    // dual monitors
    g.add(box(0.45, 0.30, 0.04, MATS.screen, stripX - 0.30, 1.10, z));
    g.add(box(0.45, 0.30, 0.04, MATS.screen, stripX + 0.30, 1.10, z));
    g.add(box(0.06, 0.30, 0.06, MATS.equipDark, stripX, 0.90, z));
    // chair
    g.add(box(0.5, 0.05, 0.5, MATS.equipDark, stripX + 1.3, 0.45, z));
    g.add(box(0.5, 0.6, 0.05, MATS.equipDark, stripX + 1.55, 0.78, z));
    // seated operator
    const op = makeSeatedOperator();
    op.position.set(stripX + 1.25, 0.0, z);
    op.rotation.y = -Math.PI / 2;
    g.add(op);
  }

  // hazard tape rectangle around ops zone floor
  g.add(box(2.6, 0.006, stripD, new THREE.MeshStandardMaterial({color: 0x2a2c30, roughness: 0.7}), stripX, 0.003, stripZ0 + stripD/2));

  g.userData = { type: "zone", id: "operator", label: "OPERATOR AREA" };
  g.userData.center = { x: stripX, z: stripZ0 + stripD / 2 };
  return g;
}

// ============================================================
// Server room — racks at bottom-left side
// ============================================================
export function buildServerRoom() {
  const g = new THREE.Group();
  const fp = getFloorPlan();
  const cx = fp.origin.x + LAYOUT.margin + fp.sideStrip / 2 - 0.5;
  const cz = fp.origin.z + fp.totalD - LAYOUT.margin - fp.gridD * 0.20;
  const roomW = fp.sideStrip;
  const roomD = fp.gridD * 0.30;

  // dark floor patch
  g.add(box(roomW, 0.018, roomD, new THREE.MeshStandardMaterial({color: 0x1e2026, roughness: 0.7}), cx, 0.01, cz));

  // racks
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 4; i++) {
      const rx = cx - 1.0 + row * 2.0;
      const rz = cz - roomD/2 + 1.0 + i * 1.5;
      g.add(box(0.6, 1.85, 0.7, MATS.serverRack, rx, 0.925, rz));
      // blink rows
      for (let b = 0; b < 8; b++) {
        const bm = new THREE.MeshStandardMaterial({color: 0x05080a, emissive: 0x2a8eff, emissiveIntensity: 0.5 + Math.random()*0.5, roughness: 0.4});
        g.add(box(0.42, 0.04, 0.03, bm, rx, 0.4 + b*0.15, rz + 0.35));
      }
    }
  }

  g.userData = { type: "zone", id: "server", label: "SERVER ROOM" };
  g.userData.center = { x: cx, z: cz };
  return g;
}

// ============================================================
// Wandering humans across the open-plan facility (overview interest)
// ============================================================
export function buildWanderers() {
  const g = new THREE.Group();
  const fp = getFloorPlan();
  const { cols, rows, cell, gap } = LAYOUT;
  // place pedestrians in aisles between rows (horizontal lanes)
  for (let r = 1; r < rows; r++) {
    const z = fp.gridZ0 + r * (cell.d + gap) - gap / 2;
    for (let i = 0; i < 3; i++) {
      const x = fp.gridX0 + (cols * (cell.w + gap)) * (0.2 + i * 0.3);
      const op = makeOperator();
      op.position.set(x + (Math.random()-0.5)*0.5, 0, z + (Math.random()-0.5)*0.3);
      op.rotation.y = Math.random() * Math.PI * 2;
      op.userData.detailShade = true;
      g.add(op);
    }
  }
  return g;
}

// ============================================================
// Facility shell: outer ground, perimeter half-walls (no ceiling),
// suspended LED bars + truss overhead, landscaping
// ============================================================
export function buildShell() {
  const g = new THREE.Group();
  const fp = getFloorPlan();

  // outer ground (asphalt) extends beyond facility
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(fp.totalW + 60, fp.totalD + 60), MATS.outerGround);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  g.add(ground);

  // interior polished concrete floor
  const interior = new THREE.Mesh(new THREE.BoxGeometry(fp.totalW, 0.04, fp.totalD), MATS.concrete);
  interior.position.set(0, 0.0, 0); interior.receiveShadow = true;
  g.add(interior);

  // perimeter walls — half-height (2.4m) so overhead view is unobstructed
  const wallH = 2.4;
  const wallT = 0.20;
  const halfW = fp.totalW/2, halfD = fp.totalD/2;
  const wN = box(fp.totalW, wallH, wallT, MATS.wallWhite, 0, wallH/2, -halfD + wallT/2);
  const wS = box(fp.totalW, wallH, wallT, MATS.wallWhite, 0, wallH/2,  halfD - wallT/2);
  const wW = box(wallT, wallH, fp.totalD, MATS.wallWhite, -halfW + wallT/2, wallH/2, 0);
  const wE = box(wallT, wallH, fp.totalD, MATS.wallWhite,  halfW - wallT/2, wallH/2, 0);
  g.add(wN, wS, wW, wE);
  // dark top trim
  g.add(box(fp.totalW, 0.08, wallT*1.2, MATS.wallTrim, 0, wallH - 0.04, -halfD + wallT/2));
  g.add(box(fp.totalW, 0.08, wallT*1.2, MATS.wallTrim, 0, wallH - 0.04,  halfD - wallT/2));
  g.add(box(wallT*1.2, 0.08, fp.totalD, MATS.wallTrim, -halfW + wallT/2, wallH - 0.04, 0));
  g.add(box(wallT*1.2, 0.08, fp.totalD, MATS.wallTrim,  halfW - wallT/2, wallH - 0.04, 0));

  // overhead truss — long horizontal beams across, just for atmosphere (no ceiling)
  const trussY = 4.6;
  const trussCols = 6;
  for (let i = 0; i < trussCols; i++) {
    const x = -halfW + (i + 0.5) * (fp.totalW / trussCols);
    const beam = box(0.10, 0.10, fp.totalD - 1.0, MATS.gantry, x, trussY, 0);
    g.add(beam);
    // blue accent under each truss beam
    g.add(box(0.04, 0.02, fp.totalD - 2.0, MATS.gantryBlue, x, trussY - 0.06, 0));
    // suspended LED bars (long fluorescent strips)
    g.add(box(0.10, 0.05, 2.2, MATS.ledStrip, x, trussY - 0.10, 0));
    g.add(box(0.10, 0.05, 2.2, MATS.ledStrip, x, trussY - 0.10, -fp.totalD * 0.30));
    g.add(box(0.10, 0.05, 2.2, MATS.ledStrip, x, trussY - 0.10,  fp.totalD * 0.30));
  }
  // cross beams (lateral)
  for (let j = 0; j < 3; j++) {
    const z = -fp.totalD * 0.35 + j * (fp.totalD * 0.35);
    g.add(box(fp.totalW - 1.0, 0.06, 0.06, MATS.gantry, 0, trussY + 0.05, z));
  }

  // exterior trees (sparse, dark)
  for (let i = 0; i < 20; i++) {
    const tx = (Math.random() - 0.5) * (fp.totalW + 50);
    const tz = (Math.random() - 0.5) * (fp.totalD + 50);
    if (Math.abs(tx) < fp.totalW/2 + 3 && Math.abs(tz) < fp.totalD/2 + 3) continue;
    const trunk = cyl(0.10, 0.6, MATS.wallTrim, tx, 0.30, tz, 8);
    const crown = sph(0.65 + Math.random()*0.4, MATS.greenery, tx, 1.10, tz, 10);
    g.add(trunk, crown);
  }
  // outdoor planters along front entrance
  for (let i = 0; i < 6; i++) {
    const x = -fp.totalW/2 + 3 + i * (fp.totalW - 6) / 5;
    const z = halfD + 1.3;
    g.add(box(2.0, 0.4, 0.6, MATS.wallTrim, x, 0.20, z));
    g.add(box(1.9, 0.25, 0.5, MATS.greenery, x, 0.50, z));
  }

  return g;
}

// ============================================================
// Zone label positions (for overhead HTML labels)
// Group adjacent stations by category and place label centered above
// ============================================================
export function getZoneLabels() {
  const fp = getFloorPlan();
  // for each category, compute center of its station cluster
  const byCat = {};
  for (let i = 0; i < STATIONS.length; i++) {
    const c = STATIONS[i].category;
    const ctr = stationCenter(i);
    if (!byCat[c]) byCat[c] = { sumX: 0, sumZ: 0, n: 0, minZ: Infinity, maxZ: -Infinity, minX: Infinity, maxX: -Infinity };
    byCat[c].sumX += ctr.x; byCat[c].sumZ += ctr.z; byCat[c].n++;
    if (ctr.z - LAYOUT.cell.d/2 < byCat[c].minZ) byCat[c].minZ = ctr.z - LAYOUT.cell.d/2;
    if (ctr.z + LAYOUT.cell.d/2 > byCat[c].maxZ) byCat[c].maxZ = ctr.z + LAYOUT.cell.d/2;
    if (ctr.x - LAYOUT.cell.w/2 < byCat[c].minX) byCat[c].minX = ctr.x - LAYOUT.cell.w/2;
    if (ctr.x + LAYOUT.cell.w/2 > byCat[c].maxX) byCat[c].maxX = ctr.x + LAYOUT.cell.w/2;
  }
  const labels = [];
  for (const c of Object.keys(byCat)) {
    const b = byCat[c];
    labels.push({ id: c, label: CATEGORIES[c].label.toUpperCase(),
                  x: (b.minX + b.maxX) / 2, y: 0.05, z: b.minZ - 0.4 });
  }
  // side zones
  labels.push({ id: "operator", label: "OPERATOR AREA",
    x: fp.origin.x + LAYOUT.margin + fp.sideStrip / 2 - 0.5, y: 0.05,
    z: fp.origin.z + LAYOUT.margin + fp.gridD * 0.28 + 0.3 });
  labels.push({ id: "server", label: "SERVER ROOM",
    x: fp.origin.x + LAYOUT.margin + fp.sideStrip / 2 - 0.5, y: 0.05,
    z: fp.origin.z + fp.totalD - LAYOUT.margin - fp.gridD * 0.05 + 0.4 });
  return labels;
}
