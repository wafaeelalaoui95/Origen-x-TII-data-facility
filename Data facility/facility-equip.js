// ============================================================
// ORIGEN Facility — Equipment builders (27 use cases)
// Each builder returns a Group sized to fit within station footprint.
// Builders take (w, d) the station inner dimensions.
// ============================================================

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MATS, box, cyl, sph } from "./facility-core.js";

function rbox(w, h, d, r, mat, x = 0, y = h / 2, z = 0) {
  const geo = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) * 0.45));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// shared: workbench with light tabletop (pink or pale blue)
function bench(w, d, cloth = "blue") {
  const g = new THREE.Group();
  const bw = w * 0.55, bd = d * 0.40;
  // legs (steel)
  for (let i = 0; i < 4; i++) {
    const x = (-1 + (i%2)*2) * (bw/2 - 0.06);
    const z = (-1 + Math.floor(i/2)*2) * (bd/2 - 0.06);
    g.add(cyl(0.03, 0.78, MATS.steel, x, 0.39, z, 8));
  }
  // top + cloth
  g.add(box(bw, 0.04, bd, MATS.tabletop, 0, 0.80, 0));
  const m = cloth === "pink" ? MATS.tableClothPink : MATS.tableCloth;
  g.add(box(bw + 0.02, 0.012, bd + 0.02, m, 0, 0.83, 0));
  return g;
}

// ============================================================
// STANDARD (use cases 1–7)
// ============================================================
export function bldStdPick(w, d) {
  const g = bench(w, d, "pink");
  // object trays (green crates)
  g.add(box(0.34, 0.08, 0.24, MATS.crateGreen, -0.55, 0.88, 0.06));
  g.add(box(0.34, 0.08, 0.24, MATS.crateGreen, -0.18, 0.88, 0.06));
  // target placement zone (taped circles + QR squares)
  for (let i = 0; i < 3; i++) g.add(cyl(0.07, 0.005, MATS.equipDark, 0.18 + i*0.18, 0.84, 0.0, 16));
  // QR-coded boxes
  for (let i = 0; i < 4; i++) g.add(box(0.10, 0.10, 0.10, MATS.boxKraft, -0.55 + (i%2)*0.18, 0.94, 0.06 + Math.floor(i/2)*0.10));
  // small cubes/cylinders
  g.add(box(0.07, 0.07, 0.07, MATS.crateBlue, 0.25, 0.87, -0.12));
  g.add(cyl(0.04, 0.10, MATS.fabricBlue, 0.36, 0.88, -0.10, 12));
  return g;
}
export function bldStdInsert(w, d) {
  const g = bench(w, d, "blue");
  // peg board — vertical
  const pb = box(0.55, 0.50, 0.04, MATS.steelDark, -0.30, 1.10, -d*0.13);
  g.add(pb);
  // pegs
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    g.add(cyl(0.012, 0.06, MATS.steel, -0.30 - 0.22 + c*0.10, 0.95 + r*0.10, -d*0.13 + 0.04, 6));
  }
  // connector panel
  g.add(box(0.30, 0.20, 0.05, MATS.equipDark, 0.30, 0.96, -d*0.13));
  for (let i = 0; i < 4; i++) g.add(cyl(0.015, 0.04, MATS.steel, 0.20 + i*0.07, 0.96, -d*0.13 + 0.03, 8));
  // plug + cable
  g.add(box(0.06, 0.06, 0.10, MATS.signRed, 0.10, 0.86, 0.05));
  // small parts tray
  g.add(box(0.30, 0.03, 0.20, MATS.steelDark, 0.10, 0.84, 0.10));
  return g;
}
export function bldStdCloseOpen(w, d) {
  const g = bench(w, d, "pink");
  // small cabinet door fixture on bench
  g.add(box(0.45, 0.45, 0.30, MATS.wood, -0.30, 1.05, 0));
  g.add(box(0.42, 0.42, 0.03, MATS.woodDark, -0.30, 1.05, 0.16)); // door
  g.add(sph(0.022, MATS.steel, -0.18, 1.05, 0.18, 8)); // handle
  // hinged boxes
  g.add(box(0.22, 0.12, 0.20, MATS.wood, 0.20, 0.88, -0.10));
  g.add(box(0.22, 0.02, 0.20, MATS.woodDark, 0.20, 0.95, -0.10)); // lid
  // sliding panel
  g.add(box(0.28, 0.20, 0.04, MATS.steelDark, 0.30, 0.94, 0.10));
  g.add(box(0.18, 0.16, 0.05, MATS.steel, 0.27, 0.94, 0.10));
  return g;
}
export function bldStdTurn(w, d) {
  const g = bench(w, d, "blue");
  // knob panel on bench
  g.add(box(0.55, 0.20, 0.04, MATS.equipDark, 0, 0.97, -d*0.12));
  for (let i = 0; i < 5; i++) g.add(cyl(0.04, 0.06, MATS.steel, -0.20 + i*0.10, 0.97, -d*0.12 + 0.03, 14));
  // valve
  g.add(cyl(0.06, 0.10, MATS.steelDark, -0.30, 0.92, 0.10, 14));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 14), MATS.steel);
  wheel.position.set(-0.30, 1.00, 0.10); wheel.castShadow = wheel.receiveShadow = true;
  g.add(wheel);
  // screw cap jars
  for (let i = 0; i < 3; i++) {
    g.add(cyl(0.05, 0.12, MATS.fabricBlue, 0.1 + i*0.14, 0.90, 0.05, 12));
    g.add(cyl(0.05, 0.02, MATS.steel,      0.1 + i*0.14, 0.97, 0.05, 12));
  }
  return g;
}
export function bldStdPushPull(w, d) {
  const g = bench(w, d, "pink");
  // sliding drawer (closed)
  g.add(box(0.50, 0.18, 0.30, MATS.wood, -0.30, 0.92, 0));
  g.add(box(0.46, 0.04, 0.04, MATS.steel, -0.30, 0.92, 0.16)); // handle
  // push plate
  g.add(box(0.30, 0.30, 0.04, MATS.steelDark, 0.10, 0.99, -d*0.12));
  g.add(cyl(0.04, 0.08, MATS.steel, 0.10, 0.99, -d*0.12 + 0.05, 10));
  // pull handle
  g.add(box(0.04, 0.30, 0.04, MATS.steel, 0.30, 0.99, -d*0.12 + 0.10));
  // force gauge display
  g.add(box(0.18, 0.10, 0.04, MATS.screenBright, 0.30, 0.99, 0.10));
  return g;
}
export function bldStdLift(w, d) {
  const g = new THREE.Group();
  // low shelf
  g.add(box(w*0.5, 0.04, 0.36, MATS.steel, -0.10, 0.30, -d*0.10));
  for (let i = 0; i < 2; i++) g.add(box(0.04, 0.30, 0.04, MATS.steel, -0.10 + (i*2-1)*w*0.24, 0.15, -d*0.10));
  // mid shelf
  g.add(box(w*0.5, 0.04, 0.36, MATS.steel, -0.10, 0.90, -d*0.10));
  for (let i = 0; i < 2; i++) g.add(box(0.04, 0.30, 0.04, MATS.steel, -0.10 + (i*2-1)*w*0.24, 0.75, -d*0.10));
  // weighted boxes
  g.add(box(0.22, 0.18, 0.22, MATS.boxKraft, -0.20, 0.39, -d*0.10));
  g.add(box(0.22, 0.18, 0.22, MATS.boxKraft, 0.05, 0.39, -d*0.10));
  g.add(box(0.22, 0.14, 0.22, MATS.boxKraft, -0.20, 0.97, -d*0.10));
  // foam parcel
  g.add(box(0.30, 0.14, 0.24, MATS.fabricWarm, 0.40, 0.37, -d*0.10));
  // height markers (yellow stripe on the floor near it)
  g.add(box(0.04, 0.005, 0.5, MATS.hazard, w*0.30, 0.011, 0));
  return g;
}
export function bldStdWipe(w, d) {
  const g = bench(w, d, "blue");
  // glass panel mounted on bench
  g.add(box(0.50, 0.40, 0.02, MATS.glass, 0, 1.06, -d*0.10));
  g.add(box(0.04, 0.40, 0.04, MATS.equipDark, -0.25, 1.06, -d*0.10));
  g.add(box(0.04, 0.40, 0.04, MATS.equipDark,  0.25, 1.06, -d*0.10));
  // cloth
  g.add(box(0.18, 0.02, 0.14, MATS.fabricBlue, 0.10, 0.85, 0.05));
  // spray bottle
  g.add(cyl(0.04, 0.16, MATS.crateBlue, -0.20, 0.92, 0.04, 10));
  g.add(box(0.04, 0.06, 0.04, MATS.equipDark, -0.20, 1.04, 0.04));
  // marked cleaning zones (tape rectangle on bench)
  g.add(box(0.36, 0.005, 0.20, MATS.signRed, 0.20, 0.852, -0.06));
  return g;
}

// ============================================================
// F&B (use cases 8–10)
// ============================================================
export function bldFbFry(w, d) {
  const g = bench(w, d, "blue");
  // induction hob on bench (dark glass top)
  g.add(box(0.60, 0.04, 0.36, MATS.robotGrille, -0.10, 0.86, 0));
  for (let i = 0; i < 4; i++) {
    g.add(cyl(0.07, 0.005, MATS.robotEye, -0.30 + (i%2)*0.40, 0.885, -0.08 + Math.floor(i/2)*0.16, 16));
  }
  // pan with spatula
  g.add(cyl(0.13, 0.04, MATS.robotBlack, -0.30, 0.91, -0.08, 16));
  g.add(box(0.25, 0.02, 0.04, MATS.robotBlack, -0.50, 0.91, -0.08));
  g.add(box(0.04, 0.02, 0.25, MATS.wood, 0.05, 0.86, 0.05));
  // bottles
  for (let i = 0; i < 3; i++) g.add(cyl(0.035, 0.18, MATS.glass, 0.30 + i*0.10, 0.93, 0.08, 10));
  // extraction hood
  g.add(box(0.70, 0.10, 0.46, MATS.steel, -0.10, 1.50, -0.05));
  g.add(box(0.40, 0.20, 0.20, MATS.steelDark, -0.10, 1.35, -0.10));
  return g;
}
export function bldFbPizza(w, d) {
  const g = bench(w, d, "pink");
  // dough disc
  g.add(cyl(0.18, 0.02, MATS.fabricWarm, -0.20, 0.86, 0.05, 18));
  // sauce bowl
  g.add(cyl(0.08, 0.06, MATS.signRed, 0.10, 0.87, -0.10, 16));
  // topping trays
  for (let i = 0; i < 4; i++) {
    const c = [0xc6433a, 0xead37a, 0x5fa14a, 0xf4ebd6][i];
    g.add(box(0.16, 0.04, 0.18, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }), 0.28, 0.86, -0.18 + i*0.12));
  }
  // spreader
  g.add(box(0.18, 0.012, 0.04, MATS.steel, 0.10, 0.86, 0.10));
  g.add(box(0.04, 0.02, 0.14, MATS.wood, 0.10, 0.86, 0.20));
  // small oven prop
  g.add(box(0.50, 0.40, 0.42, MATS.steel, -0.55, 1.05, -0.05));
  g.add(box(0.36, 0.16, 0.02, MATS.robotVisor, -0.55, 1.05, 0.17));
  return g;
}
export function bldFbSandwich(w, d) {
  const g = bench(w, d, "pink");
  // bread slices
  for (let i = 0; i < 3; i++) g.add(box(0.18, 0.04, 0.18, MATS.wood, -0.40 + i*0.18, 0.86, -0.05));
  // ingredient bowls
  g.add(cyl(0.08, 0.04, MATS.crateGreen, 0.10, 0.85, 0.05, 14));
  g.add(cyl(0.08, 0.04, MATS.signRed,    0.28, 0.85, 0.05, 14));
  g.add(cyl(0.08, 0.04, MATS.warmLamp,   0.10, 0.85, -0.12, 14));
  // condiment bottles
  for (let i = 0; i < 2; i++) g.add(cyl(0.035, 0.16, MATS.signRed, 0.50, 0.92, -0.10 + i*0.20, 10));
  // tray
  g.add(box(0.40, 0.012, 0.28, MATS.steel, -0.20, 0.87, 0.12));
  // packaging paper roll
  g.add(cyl(0.06, 0.30, MATS.fabricWarm, -0.55, 0.88, 0.10, 14).rotateZ(Math.PI/2));
  return g;
}

// ============================================================
// HOME (use cases 11–18)
// ============================================================
export function bldHomeFold(w, d) {
  const g = bench(w, d, "blue");
  // alignment grid (on tabletop)
  for (let i = 0; i <= 4; i++) g.add(box(0.6, 0.002, 0.005, MATS.signRed, 0, 0.838, -0.18 + i*0.09));
  // shirts stacked
  g.add(box(0.32, 0.04, 0.24, MATS.fabricBlue, -0.20, 0.86, 0.05));
  g.add(box(0.32, 0.04, 0.24, MATS.fabricWarm, -0.20, 0.90, 0.05));
  // pants folded
  g.add(box(0.30, 0.08, 0.22, MATS.opPants, 0.20, 0.88, 0.05));
  // laundry basket
  g.add(box(0.42, 0.32, 0.30, MATS.crateGreen, w*0.30, 0.16, d*0.10));
  return g;
}
export function bldHomeCounter(w, d) {
  const g = new THREE.Group();
  // counter
  g.add(box(w*0.7, 0.85, d*0.36, MATS.wood, 0, 0.425, 0));
  g.add(box(w*0.7, 0.04, d*0.38, MATS.tabletop, 0, 0.87, 0));
  // sink basin
  g.add(box(0.45, 0.14, 0.30, MATS.steelDark, -0.10, 0.83, 0));
  // faucet (curved)
  g.add(cyl(0.025, 0.20, MATS.steel, -0.10, 1.00, -0.12, 10));
  g.add(box(0.04, 0.04, 0.20, MATS.steel, -0.10, 1.10, -0.05));
  // tap handles
  g.add(sph(0.025, MATS.steel, -0.22, 1.00, -0.10, 8));
  g.add(sph(0.025, MATS.steel,  0.02, 1.00, -0.10, 8));
  // push buttons (panel)
  g.add(box(0.18, 0.06, 0.04, MATS.equipDark, 0.30, 1.05, -d*0.17));
  for (let i = 0; i < 3; i++) g.add(cyl(0.012, 0.02, MATS.signRed, 0.24 + i*0.06, 1.07, -d*0.17 + 0.022, 8));
  // soap dispenser
  g.add(box(0.06, 0.18, 0.06, MATS.steel, 0.30, 0.98, -0.05));
  // sponge
  g.add(box(0.10, 0.04, 0.06, MATS.warmLamp, 0.18, 0.90, -0.04));
  // cups
  g.add(cyl(0.04, 0.10, MATS.tabletop, 0.42, 0.94, 0.05, 12));
  g.add(cyl(0.04, 0.10, MATS.tabletop, 0.50, 0.94, 0.05, 12));
  // small appliance (kettle-like)
  g.add(box(0.18, 0.20, 0.14, MATS.steel, -0.55, 0.99, -0.05));
  return g;
}
export function bldHomeDishrack(w, d) {
  const g = new THREE.Group();
  // dishwasher mockup with readable appliance front and open rack
  const bodyW = 0.78;
  const bodyD = 0.62;
  g.add(rbox(bodyW, 0.92, bodyD, 0.06, MATS.steel, 0, 0.46, -0.04));
  g.add(rbox(bodyW * 0.92, 0.72, 0.05, 0.035, MATS.robotWhite, 0, 0.47, bodyD / 2 - 0.01));
  g.add(box(bodyW * 0.78, 0.035, 0.025, MATS.equipDark, 0, 0.78, bodyD / 2 + 0.03));
  g.add(box(bodyW * 0.86, 0.04, 0.035, MATS.screenBright, 0, 0.86, bodyD / 2 + 0.035));
  for (let i = 0; i < 4; i++) g.add(cyl(0.014, 0.014, MATS.robotEye, -0.23 + i * 0.15, 0.86, bodyD / 2 + 0.06, 10).rotateX(Math.PI / 2));
  // pulled-out rack
  const rackZ = bodyD / 2 + 0.34;
  g.add(rbox(0.72, 0.045, 0.56, 0.025, MATS.steelDark, 0, 0.50, rackZ));
  for (let i = 0; i < 6; i++) g.add(box(0.018, 0.16, 0.46, MATS.steel, -0.30 + i*0.12, 0.58, rackZ));
  g.add(box(0.72, 0.035, 0.045, MATS.steel, 0, 0.58, rackZ + 0.26));
  // plates upright (in slots)
  for (let i = 0; i < 7; i++) g.add(cyl(0.070, 0.018, MATS.tabletop, -0.32 + i*0.105, 0.64, rackZ, 18).rotateX(Math.PI / 2));
  // cups
  for (let i = 0; i < 4; i++) g.add(cyl(0.040, 0.09, MATS.tabletop, 0.10 + i*0.09, 0.58, rackZ - 0.16, 14));
  // utensil cup
  g.add(cyl(0.060, 0.13, MATS.steelDark, -0.30, 0.59, rackZ - 0.18, 12));
  for (let i = 0; i < 5; i++) g.add(box(0.01, 0.18, 0.01, MATS.steel, -0.33 + i * 0.022, 0.72, rackZ - 0.18));
  // loose dishes waiting to load
  g.add(cyl(0.08, 0.018, MATS.tabletop, 0.62, 0.03, 0.54, 18));
  g.add(cyl(0.07, 0.018, MATS.tabletop, 0.72, 0.05, 0.48, 18));
  g.add(cyl(0.04, 0.10, MATS.tabletop, 0.56, 0.05, 0.40, 14));
  return g;
}
export function bldHomeDrawers(w, d) {
  const g = new THREE.Group();
  g.add(box(w*0.55, 1.10, d*0.36, MATS.wood, 0, 0.55, 0));
  // three drawer fronts at different open states
  g.add(box(w*0.55, 0.30, 0.04, MATS.woodDark, 0, 0.20, d*0.18));        // closed bottom
  g.add(box(w*0.55, 0.30, 0.04, MATS.woodDark, 0, 0.55, d*0.18 + 0.06)); // mid (slightly open)
  g.add(box(w*0.55, 0.30, 0.04, MATS.woodDark, 0, 0.90, d*0.18 + 0.12)); // top (more open)
  for (let i = 0; i < 3; i++) g.add(box(0.18, 0.02, 0.04, MATS.steel, 0, 0.20 + i*0.35, d*0.18 + 0.02 + i*0.06));
  // stored objects visible in top drawer
  g.add(box(0.20, 0.06, 0.16, MATS.boxKraft, -0.18, 0.96, d*0.18 + 0.08));
  g.add(box(0.20, 0.06, 0.16, MATS.crateGreen, 0.05, 0.96, d*0.18 + 0.08));
  return g;
}
export function bldHomeFridge(w, d) {
  const g = new THREE.Group();
  const fridgeW = 0.82;
  const fridgeD = 0.72;
  const fridgeH = 1.78;
  // fridge body
  g.add(rbox(fridgeW, fridgeH, fridgeD, 0.07, MATS.steel, 0, fridgeH / 2, -0.10));
  g.add(rbox(fridgeW * 0.90, 0.05, fridgeD * 0.96, 0.025, MATS.steelDark, 0, 1.03, -0.10));
  g.add(box(0.035, 1.35, 0.035, MATS.equipDark, fridgeW / 2 + 0.035, 0.90, fridgeD / 2 - 0.13));
  // door opened (rotated)
  const door = new THREE.Group();
  door.position.set(-fridgeW / 2, 0, -0.10 + fridgeD / 2);
  const dPanel = rbox(fridgeW * 0.88, fridgeH * 0.96, 0.05, 0.045, MATS.robotWhite, fridgeW * 0.44, fridgeH * 0.48, 0);
  door.add(dPanel);
  // door shelves
  for (let i = 0; i < 3; i++) door.add(box(fridgeW * 0.68, 0.04, 0.10, MATS.steel, fridgeW * 0.44, 0.45 + i*0.42, 0.07));
  // bottles in door
  for (let i = 0; i < 3; i++) door.add(cyl(0.035, 0.18, MATS.glass, fridgeW * 0.24 + i*0.09, 1.02, 0.10, 10));
  door.rotation.y = -0.95;
  g.add(door);
  // interior shelves visible
  for (let i = 0; i < 3; i++) g.add(box(fridgeW*0.82, 0.03, fridgeD*0.72, MATS.steel, 0, 0.44 + i*0.42, -0.10));
  // boxes
  g.add(box(0.18, 0.10, 0.16, MATS.boxKraft, -0.12, 0.55, -0.10));
  g.add(box(0.16, 0.10, 0.14, MATS.crateGreen, 0.14, 0.55, -0.10));
  g.add(cyl(0.035, 0.20, MATS.glass, -0.20, 1.02, -0.08, 12));
  g.add(cyl(0.035, 0.20, MATS.glass, 0.06, 1.42, -0.08, 12));
  return g;
}
export function bldHomeDrum(w, d) {
  const g = new THREE.Group();
  const bodyW = 0.76;
  const bodyD = 0.66;
  g.add(rbox(bodyW, 0.98, bodyD, 0.07, MATS.steel, 0, 0.49, 0));
  g.add(rbox(bodyW * 0.92, 0.82, 0.045, 0.035, MATS.robotWhite, 0, 0.46, bodyD / 2 + 0.01));
  g.add(rbox(bodyW, 0.10, bodyD * 1.04, 0.035, MATS.steelDark, 0, 0.97, 0));
  g.add(box(bodyW * 0.28, 0.035, 0.035, MATS.screenBright, -bodyW * 0.18, 1.02, bodyD / 2 + 0.035));
  for (let i = 0; i < 3; i++) g.add(cyl(0.014, 0.012, MATS.robotEye, bodyW * 0.04 + i * 0.08, 1.02, bodyD / 2 + 0.055, 10).rotateX(Math.PI / 2));
  // circular drum door (recessed)
  const drumOut = cyl(0.31, 0.06, MATS.steelDark, 0, 0.50, bodyD / 2 + 0.035, 28).rotateX(Math.PI/2);
  g.add(drumOut);
  const drumIn = cyl(0.24, 0.04, MATS.glass, 0, 0.50, bodyD / 2 + 0.07, 28).rotateX(Math.PI/2);
  g.add(drumIn);
  g.add(cyl(0.17, 0.018, MATS.robotGrille, 0, 0.50, bodyD / 2 + 0.095, 24).rotateX(Math.PI/2));
  g.add(box(0.12, 0.035, 0.035, MATS.equipDark, 0.25, 0.50, bodyD / 2 + 0.10));
  // clothes partly in the drum and staged beside the machine
  g.add(box(0.18, 0.055, 0.12, MATS.fabricBlue, -0.08, 0.50, bodyD / 2 + 0.13));
  g.add(box(0.16, 0.045, 0.12, MATS.fabricWarm, 0.07, 0.46, bodyD / 2 + 0.14));
  // detergent bottle
  g.add(cyl(0.05, 0.20, MATS.crateBlue, 0.58, 0.98, -0.08, 12));
  g.add(box(0.08, 0.035, 0.05, MATS.tabletop, 0.58, 1.095, -0.08));
  // laundry basket
  g.add(box(0.40, 0.30, 0.28, MATS.crateGreen, 0.70, 0.15, 0.42));
  // clothes inside basket
  g.add(box(0.36, 0.10, 0.24, MATS.fabricBlue, 0.70, 0.34, 0.42));
  g.add(box(0.24, 0.06, 0.18, MATS.fabricWarm, -0.62, 0.03, 0.50));
  g.add(box(0.22, 0.05, 0.16, MATS.opPants, -0.78, 0.03, 0.34));
  return g;
}
export function bldHomeBed(w, d) {
  const g = new THREE.Group();
  // frame
  g.add(box(1.6, 0.22, 2.0, MATS.woodDark, -w*0.10, 0.11, 0));
  // mattress
  g.add(box(1.55, 0.18, 1.95, MATS.tabletop, -w*0.10, 0.32, 0));
  // fitted sheet
  g.add(box(1.55, 0.02, 1.95, MATS.fabricWarm, -w*0.10, 0.42, 0));
  // blanket (folded across mid)
  g.add(box(1.55, 0.10, 1.10, MATS.fabricBlue, -w*0.10, 0.47, 0.35));
  // pillows
  g.add(box(0.50, 0.10, 0.30, MATS.tabletop, -w*0.10 - 0.30, 0.50, -0.78));
  g.add(box(0.50, 0.10, 0.30, MATS.tabletop, -w*0.10 + 0.30, 0.50, -0.78));
  // headboard
  g.add(box(1.7, 0.7, 0.08, MATS.woodDark, -w*0.10, 0.78, -1.02));
  // bedside table + lamp
  g.add(box(0.40, 0.50, 0.40, MATS.woodDark, w*0.32, 0.25, -0.7));
  g.add(cyl(0.06, 0.30, MATS.warmLamp, w*0.32, 0.65, -0.7, 14));
  // linen basket
  g.add(box(0.40, 0.30, 0.32, MATS.crateGreen, w*0.32, 0.15, 0.6));
  return g;
}
export function bldHomeWashdish(w, d) {
  const g = new THREE.Group();
  // counter
  g.add(box(w*0.65, 0.85, d*0.36, MATS.wood, 0, 0.425, 0));
  g.add(box(w*0.65, 0.04, d*0.38, MATS.tabletop, 0, 0.87, 0));
  // sink basin (double)
  g.add(box(0.40, 0.14, 0.30, MATS.steelDark, -0.20, 0.83, 0));
  g.add(box(0.40, 0.14, 0.30, MATS.steelDark,  0.20, 0.83, 0));
  // faucet
  g.add(cyl(0.025, 0.22, MATS.steel, 0, 1.00, -0.12, 10));
  g.add(box(0.04, 0.04, 0.20, MATS.steel, 0, 1.10, -0.04));
  // dish rack
  g.add(box(0.42, 0.04, 0.28, MATS.steel, w*0.34, 0.89, 0.05));
  for (let i = 0; i < 5; i++) g.add(box(0.10, 0.14, 0.02, MATS.tabletop, w*0.20 + i*0.07, 0.96, 0.05));
  // sponge + soap
  g.add(box(0.10, 0.04, 0.06, MATS.warmLamp, 0.35, 0.90, 0.10));
  g.add(box(0.06, 0.18, 0.06, MATS.steel, 0.42, 0.98, -0.10));
  return g;
}

// ============================================================
// LOGISTICS (use cases 19–21)
// ============================================================
export function bldLogConveyor(w, d) {
  const g = new THREE.Group();
  // belt body
  g.add(box(w*0.75, 0.5, 0.7, MATS.steelDark, 0, 0.5, 0));
  g.add(box(w*0.75, 0.04, 0.66, MATS.robotGrille, 0, 0.77, 0));
  // boxes on belt
  for (let i = 0; i < 4; i++) g.add(box(0.32, 0.30, 0.32, MATS.boxKraft, -w*0.30 + i*0.25, 0.94, 0));
  // sensor arch
  g.add(box(0.06, 0.7, 0.04, MATS.gantry, -w*0.10, 0.35, -0.45));
  g.add(box(0.06, 0.7, 0.04, MATS.gantry, -w*0.10, 0.35,  0.45));
  g.add(box(0.04, 0.04, 0.90, MATS.gantry, -w*0.10, 0.75, 0));
  // scanner head
  g.add(box(0.14, 0.10, 0.18, MATS.robotBlack, -w*0.10, 0.70, 0));
  // sorting bins
  g.add(box(0.5, 0.4, 0.4, MATS.crateGreen, w*0.30, 0.20, -0.45));
  g.add(box(0.5, 0.4, 0.4, MATS.crateBlue,  w*0.30, 0.20,  0.45));
  return g;
}
export function bldLogPack(w, d) {
  const g = new THREE.Group();
  // packing table
  g.add(box(w*0.55, 0.85, d*0.40, MATS.steel, 0, 0.425, 0));
  // small conveyor section
  g.add(box(w*0.55, 0.20, 0.30, MATS.steelDark, 0, 0.96, -d*0.15));
  // carton being packed
  g.add(box(0.40, 0.20, 0.32, MATS.boxKraft, -0.10, 0.96, 0.05));
  // tape dispenser
  g.add(cyl(0.07, 0.08, MATS.signRed, 0.25, 0.92, 0.08, 12).rotateX(Math.PI/2));
  // label printer
  g.add(box(0.24, 0.16, 0.20, MATS.robotBlack, w*0.28, 0.96, 0.05));
  // scale
  g.add(box(0.30, 0.04, 0.30, MATS.steelDark, -0.30, 0.89, 0.05));
  g.add(box(0.20, 0.06, 0.05, MATS.screenBright, -0.30, 0.94, -0.10));
  // parcel bins
  g.add(box(0.40, 0.30, 0.36, MATS.crateGreen, -w*0.32, 0.15, d*0.10));
  g.add(box(0.40, 0.30, 0.36, MATS.crateGreen, -w*0.32, 0.15, -d*0.10));
  return g;
}
export function bldLogShelf(w, d) {
  const g = new THREE.Group();
  // multi-level shelf
  const sx = w * 0.55, sd = d * 0.34;
  // uprights
  for (let i = 0; i < 4; i++) g.add(box(0.05, 2.4, 0.05, MATS.steelDark, -sx/2 + (i%2)*sx, 1.2, -d*0.10 + (Math.floor(i/2)-0)*(-sd/1.2)));
  // 3 levels
  for (let lvl = 0; lvl < 3; lvl++) {
    g.add(box(sx, 0.04, sd, MATS.steel, 0, 0.6 + lvl*0.7, -d*0.10));
    // bins / boxes per level
    for (let i = 0; i < 5; i++) {
      const c = [MATS.crateGreen, MATS.crateBlue, MATS.boxKraft][lvl%3];
      g.add(box(0.28, 0.22, 0.30, c, -sx/2 + 0.18 + i*0.18, 0.73 + lvl*0.7, -d*0.10));
    }
    // pick light strip on level edge
    g.add(box(sx, 0.012, 0.015, MATS.ledStrip, 0, 0.62 + lvl*0.7, -d*0.10 + sd/2 - 0.01));
  }
  return g;
}

// ============================================================
// SECURITY (use cases 22–24)
// ============================================================
export function bldSecAccess(w, d) {
  const g = new THREE.Group();
  // door frame
  g.add(box(0.10, 2.2, 1.10, MATS.equipDark, 0, 1.1, 0));
  g.add(box(0.06, 2.0, 1.00, MATS.fabricBlue, 0, 1.0, 0));
  // keypad
  g.add(box(0.10, 0.22, 0.14, MATS.robotBlack, -0.08, 1.20, 0.62));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    g.add(box(0.020, 0.020, 0.03, MATS.steel, -0.08, 1.27 - r*0.05, 0.58 + c*0.04));
  }
  // card reader (with green LED)
  g.add(box(0.08, 0.14, 0.10, MATS.equipDark, -0.08, 1.20, 0.45));
  g.add(box(0.04, 0.02, 0.04, new THREE.MeshStandardMaterial({color: 0x000, emissive: 0x3aff66, emissiveIntensity: 1.5}), -0.04, 1.20, 0.50));
  // intercom
  g.add(box(0.08, 0.16, 0.10, MATS.steel, -0.08, 1.45, 0.55));
  // push button
  g.add(cyl(0.025, 0.04, MATS.signRed, -0.08, 1.05, 0.55, 10).rotateZ(Math.PI/2));
  return g;
}
export function bldSecHandle(w, d) {
  const g = new THREE.Group();
  // four door panels along a back rail
  const railZ = -d*0.13;
  for (let i = 0; i < 4; i++) {
    const x = -w*0.30 + i*(w*0.20);
    g.add(box(0.08, 2.0, 0.65, MATS.equipDark, x - 0.05, 1.0, railZ));   // frame
    g.add(box(0.04, 1.85, 0.55, MATS.wood, x, 0.95, railZ));              // door
    // variety of handles
    if (i === 0) g.add(box(0.04, 0.04, 0.18, MATS.steel, x + 0.04, 0.95, railZ + 0.14)); // lever
    else if (i === 1) g.add(sph(0.04, MATS.steel, x + 0.04, 0.95, railZ + 0.18, 10));     // knob
    else if (i === 2) g.add(box(0.04, 0.18, 0.04, MATS.steel, x + 0.04, 0.95, railZ + 0.18)); // vertical bar
    else { // round
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 14), MATS.steel);
      r.position.set(x + 0.04, 0.95, railZ + 0.18); r.castShadow = r.receiveShadow = true; g.add(r);
    }
  }
  return g;
}
export function bldSecHeavy(w, d) {
  const g = new THREE.Group();
  // industrial weighted panel
  g.add(box(0.10, 2.0, 1.3, MATS.equipDark, -w*0.05, 1.0, 0));
  g.add(box(0.06, 1.85, 1.20, MATS.steelDark, -w*0.05 + 0.05, 0.95, 0));
  // industrial handle (big bar)
  g.add(box(0.05, 0.10, 0.50, MATS.steel, -w*0.05 + 0.10, 1.10, 0.20));
  // resistance slider on side
  g.add(box(0.20, 0.06, 0.30, MATS.signRed, w*0.20, 0.95, 0.10));
  // force gauge display
  g.add(box(0.30, 0.22, 0.04, MATS.screenBright, w*0.20, 1.30, -0.20));
  g.add(box(0.06, 0.40, 0.06, MATS.equipDark, w*0.20, 1.10, -0.20));
  return g;
}

// ============================================================
// MOBILITY (use cases 25–27)
// ============================================================
export function bldMobSteps(w, d) {
  const g = new THREE.Group();
  // stair flight
  for (let i = 0; i < 5; i++) {
    const h = 0.16 * (i + 1);
    g.add(box(w*0.4, h, 0.30, MATS.steelDark, -w*0.20, h/2, -d*0.30 + i*0.30));
  }
  // top platform
  g.add(box(w*0.4, 0.10, 0.40, MATS.steelDark, -w*0.20, 0.85, -d*0.30 + 5*0.30 + 0.20));
  // handrail
  g.add(box(0.04, 0.04, 1.7, MATS.steel, -w*0.20 - w*0.20, 1.20, -d*0.10));
  g.add(box(0.04, 1.0, 0.04, MATS.steel, -w*0.20 - w*0.20, 0.70, -d*0.30));
  g.add(box(0.04, 1.0, 0.04, MATS.steel, -w*0.20 - w*0.20, 0.70, -d*0.30 + 1.7));
  // threshold strip
  g.add(box(0.4, 0.06, 0.10, MATS.hazard, w*0.05, 0.03, 0));
  // door frame
  g.add(box(0.06, 2.1, 1.0, MATS.equipDark, w*0.25, 1.05, 0));
  g.add(box(0.04, 1.95, 0.90, MATS.wood, w*0.25 + 0.02, 0.98, 0));
  // ramp
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.5), MATS.steelDark);
  ramp.rotation.x = 0.18; ramp.position.set(w*0.0, 0.18, d*0.25);
  ramp.castShadow = ramp.receiveShadow = true;
  g.add(ramp);
  return g;
}
export function bldMobMulti(w, d) {
  const g = new THREE.Group();
  // floor objects
  g.add(box(0.20, 0.12, 0.20, MATS.boxKraft, -w*0.25, 0.06, d*0.20));
  g.add(box(0.20, 0.12, 0.20, MATS.crateGreen, -w*0.10, 0.06, d*0.25));
  // mid-height table
  g.add(box(w*0.35, 0.04, d*0.30, MATS.tabletop, -w*0.05, 0.80, 0));
  for (let i = 0; i < 4; i++) {
    const x = -w*0.05 + (i%2 ? 1 : -1) * (w*0.16);
    const z = (Math.floor(i/2) ? 1 : -1) * (d*0.13);
    g.add(cyl(0.03, 0.78, MATS.steel, x, 0.39, z, 8));
  }
  g.add(box(0.18, 0.08, 0.18, MATS.boxKraft, -w*0.05, 0.86, -0.05));
  // high shelf
  g.add(box(w*0.4, 0.04, d*0.28, MATS.steel, w*0.25, 1.8, -d*0.05));
  g.add(box(0.04, 1.7, 0.04, MATS.steel, w*0.10, 0.90, -d*0.18));
  g.add(box(0.04, 1.7, 0.04, MATS.steel, w*0.40, 0.90, -d*0.18));
  g.add(box(0.04, 1.7, 0.04, MATS.steel, w*0.10, 0.90,  d*0.05));
  g.add(box(0.04, 1.7, 0.04, MATS.steel, w*0.40, 0.90,  d*0.05));
  // bins on high shelf
  for (let i = 0; i < 3; i++) g.add(box(0.22, 0.18, 0.24, MATS.crateBlue, w*0.10 + i*0.14, 1.93, -d*0.05));
  return g;
}
export function bldMobBimanual(w, d) {
  const g = new THREE.Group();
  // large box on the floor
  g.add(box(0.80, 0.50, 0.55, MATS.boxKraft, -w*0.10, 0.25, 0));
  // wide tray on stand
  g.add(box(w*0.45, 0.04, d*0.30, MATS.tabletop, w*0.20, 0.62, -d*0.05));
  for (let i = 0; i < 4; i++) {
    const x = w*0.20 + (i%2 ? 1 : -1) * (w*0.20);
    const z = -d*0.05 + (Math.floor(i/2) ? 1 : -1) * (d*0.13);
    g.add(cyl(0.025, 0.60, MATS.steel, x, 0.30, z, 8));
  }
  // furniture-like object
  g.add(box(0.5, 0.4, 0.40, MATS.fabricBlue, w*0.20, 0.85, -d*0.05));
  // obstacle lane markers (cones)
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.20, 12), MATS.signRed);
    cone.position.set(w*0.0 + i*0.4 - 0.6, 0.10, d*0.30); cone.castShadow = cone.receiveShadow = true;
    g.add(cone);
  }
  return g;
}

// home — Mopping the floor (HOME, A2)
export function bldHomeMop(w, d) {
  const g = new THREE.Group();
  // marked soiled floor zone (dark translucent patch + hazard border)
  const zone = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.5, d * 0.42),
    new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.85, transparent: true, opacity: 0.55 })
  );
  zone.rotation.x = -Math.PI / 2; zone.position.set(-w * 0.05, 0.016, d * 0.04); zone.receiveShadow = true;
  g.add(zone);
  g.add(box(w * 0.5, 0.004, 0.04, MATS.hazard, -w * 0.05, 0.02, d * 0.04 - d * 0.21));
  g.add(box(w * 0.5, 0.004, 0.04, MATS.hazard, -w * 0.05, 0.02, d * 0.04 + d * 0.21));
  // bucket with wringer
  g.add(cyl(0.20, 0.36, MATS.crateBlue, w * 0.30, 0.18, d * 0.06, 18));
  g.add(cyl(0.205, 0.05, MATS.steelDark, w * 0.30, 0.38, d * 0.06, 18));
  g.add(box(0.30, 0.18, 0.14, MATS.fabricWarm, w * 0.30, 0.46, d * 0.06)); // wringer basket
  g.add(box(0.06, 0.10, 0.16, MATS.steel, w * 0.30 + 0.18, 0.40, d * 0.06)); // handle lever
  // mop leaning against the bucket
  const pole = cyl(0.022, 1.30, MATS.wood, w * 0.30 - 0.10, 0.65, d * 0.06 - 0.30, 10);
  pole.rotation.x = 0.42; g.add(pole);
  g.add(sph(0.13, MATS.fabricWarm, w * 0.30 - 0.10, 0.06, d * 0.06 - 0.78, 10)); // mop head
  // caution A-frame sign
  for (const s of [-1, 1]) {
    const f = box(0.30, 0.46, 0.02, MATS.warmLamp, -w * 0.30, 0.25, d * 0.04 + s * 0.04);
    f.rotation.x = s * 0.16; g.add(f);
  }
  g.add(box(0.20, 0.10, 0.02, MATS.signRed, -w * 0.30, 0.32, d * 0.04));
  return g;
}

// locomotion — Door opening / closing, variable resistance (LOCOMOTION, 2× A2)
export function bldLocoDoor(w, d) {
  const g = new THREE.Group();
  const railZ = -d * 0.10;
  // two free-standing doors of differing resistance, side by side
  const xs = [-w * 0.20, w * 0.18];
  xs.forEach((x, k) => {
    // frame uprights + lintel
    g.add(box(0.10, 2.20, 0.12, MATS.equipDark, x - 0.50, 1.10, railZ));
    g.add(box(0.10, 2.20, 0.12, MATS.equipDark, x + 0.50, 1.10, railZ));
    g.add(box(1.10, 0.14, 0.12, MATS.equipDark, x, 2.18, railZ));
    // door panel — slightly ajar (rotate around its hinge)
    const door = new THREE.Group();
    door.position.set(x - 0.46, 0, railZ);
    const panel = box(0.92, 1.96, 0.06, k === 0 ? MATS.wood : MATS.steelDark, 0.46, 1.02, 0);
    door.add(panel);
    // handle: lever on first, push bar on second
    if (k === 0) door.add(box(0.05, 0.05, 0.20, MATS.steel, 0.82, 1.02, 0.06));
    else door.add(box(0.06, 0.70, 0.06, MATS.steel, 0.80, 1.02, 0.05));
    door.rotation.y = k === 0 ? -0.55 : -0.28; // different open angle
    g.add(door);
    // resistance module + dial on the frame
    g.add(box(0.16, 0.22, 0.12, MATS.robotBlack, x + 0.50, 1.55, railZ + 0.10));
    g.add(cyl(0.05, 0.03, MATS.signRed, x + 0.50, 1.62, railZ + 0.17, 12).rotateX(Math.PI / 2));
    // small force-gauge screen
    g.add(box(0.18, 0.12, 0.03, MATS.screenBright, x + 0.50, 1.30, railZ + 0.12));
  });
  // floor markers between the two doors
  g.add(box(0.06, 0.005, d * 0.6, MATS.hazard, 0, 0.02, d * 0.05));
  return g;
}

// Dispatch
export const KIND_BUILDERS = {
  "home-mop":      bldHomeMop,
  "loco-door":     bldLocoDoor,
  "std-pick":      bldStdPick,
  "std-insert":    bldStdInsert,
  "std-closeopen": bldStdCloseOpen,
  "std-turn":      bldStdTurn,
  "std-pushpull":  bldStdPushPull,
  "std-lift":      bldStdLift,
  "std-wipe":      bldStdWipe,
  "fb-fry":        bldFbFry,
  "fb-pizza":      bldFbPizza,
  "fb-sandwich":   bldFbSandwich,
  "home-fold":     bldHomeFold,
  "home-counter":  bldHomeCounter,
  "home-dishrack": bldHomeDishrack,
  "home-drawers":  bldHomeDrawers,
  "home-fridge":   bldHomeFridge,
  "home-drum":     bldHomeDrum,
  "home-bed":      bldHomeBed,
  "home-washdish": bldHomeWashdish,
  "log-conveyor":  bldLogConveyor,
  "log-pack":      bldLogPack,
  "log-shelf":     bldLogShelf,
  "sec-access":    bldSecAccess,
  "sec-handle":    bldSecHandle,
  "sec-heavy":     bldSecHeavy,
  "mob-steps":     bldMobSteps,
  "mob-multi":     bldMobMulti,
  "mob-bimanual":  bldMobBimanual,
};
