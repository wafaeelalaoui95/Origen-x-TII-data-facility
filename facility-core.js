// ============================================================
// ORIGEN Facility — Core: materials, helpers, robots, operators, overhead gantry
// ============================================================

import * as THREE from "three";

export const MATS = {};

export function buildMaterials() {
  // ---- structural / floor / wall ----
  MATS.outerGround = new THREE.MeshStandardMaterial({ color: 0xb4c3d0, roughness: 0.92, metalness: 0.0 });
  MATS.concrete    = new THREE.MeshStandardMaterial({ color: 0x9a9da2, roughness: 0.55, metalness: 0.08 });
  MATS.concreteDark= new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7,  metalness: 0.05 });
  MATS.wallWhite   = new THREE.MeshStandardMaterial({ color: 0xeceef1, roughness: 0.85, metalness: 0.02 });
  MATS.wallTrim    = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.45, metalness: 0.5  });
  MATS.glass       = new THREE.MeshPhysicalMaterial({ color: 0xbacbd6, roughness: 0.05, transmission: 0.85, transparent: true, opacity: 0.18, ior: 1.45, thickness: 0.3, side: THREE.DoubleSide });
  MATS.partition   = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.85, metalness: 0.02 });
  MATS.partitionEdge = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.45, metalness: 0.55 });

  // ---- hazard tape (yellow/black striped via texture) ----
  const c = document.createElement("canvas"); c.width = 256; c.height = 32;
  const ctx = c.getContext("2d");
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(x, 0, 16, 32);
    ctx.fillStyle = "#f7c64d"; ctx.fillRect(x + 16, 0, 16, 32);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(8, 1);
  tex.anisotropy = 8;
  MATS.hazard = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 });

  // ---- robot shells ----
  MATS.robotWhite = new THREE.MeshStandardMaterial({ color: 0xe6e8eb, roughness: 0.28, metalness: 0.55 });
  MATS.robotShellEdge = new THREE.MeshStandardMaterial({ color: 0xc4c7cc, roughness: 0.35, metalness: 0.5 });
  MATS.robotBlack = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.32, metalness: 0.75 });
  MATS.robotJoint = new THREE.MeshStandardMaterial({ color: 0x232529, roughness: 0.3,  metalness: 0.85 });
  MATS.robotVisor = new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0x223344, emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.9 });
  MATS.robotGrille = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.45, metalness: 0.5 });
  MATS.robotEye = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb86b, emissiveIntensity: 1.6 });

  // ---- operator (matte cloth + skin + headset) ----
  MATS.opSkin   = new THREE.MeshStandardMaterial({ color: 0xc69877, roughness: 0.75, metalness: 0.0 });
  MATS.opShirt  = new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.92, metalness: 0.0 });
  MATS.opPants  = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.92, metalness: 0.0 });
  MATS.opVest   = new THREE.MeshStandardMaterial({ color: 0x4a5160, roughness: 0.85, metalness: 0.05 });
  MATS.opHair   = new THREE.MeshStandardMaterial({ color: 0x14110e, roughness: 0.9,  metalness: 0.0 });
  MATS.headset  = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.3,  metalness: 0.6 });
  MATS.headsetLens = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x2a8eff, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0.8 });

  // ---- gantry / cabling / lights ----
  MATS.gantry  = new THREE.MeshStandardMaterial({ color: 0xf6f7f9, roughness: 0.4, metalness: 0.4 });
  MATS.gantryBlue = new THREE.MeshStandardMaterial({ color: 0x1f6dd8, emissive: 0x1f6dd8, emissiveIntensity: 0.25, roughness: 0.5, metalness: 0.3 });
  MATS.cable   = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.85, metalness: 0.15 });
  MATS.ledStrip= new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.5 });
  MATS.camHousing = new THREE.MeshStandardMaterial({ color: 0xf0f1f3, roughness: 0.45, metalness: 0.4 });
  MATS.camLens = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x4cc3ff, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.9 });

  // ---- equipment palette ----
  MATS.steel       = new THREE.MeshStandardMaterial({ color: 0xc8cbd0, roughness: 0.35, metalness: 0.75 });
  MATS.steelDark   = new THREE.MeshStandardMaterial({ color: 0x55595f, roughness: 0.45, metalness: 0.65 });
  MATS.tabletop    = new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: 0.55, metalness: 0.1 });
  MATS.tableCloth  = new THREE.MeshStandardMaterial({ color: 0xc4d7e0, roughness: 0.9, metalness: 0.0 });
  MATS.tableClothPink = new THREE.MeshStandardMaterial({ color: 0xe6cdd3, roughness: 0.9, metalness: 0.0 });
  MATS.equipDark   = new THREE.MeshStandardMaterial({ color: 0x232529, roughness: 0.4, metalness: 0.5 });
  MATS.wood        = new THREE.MeshStandardMaterial({ color: 0x9c7a55, roughness: 0.7, metalness: 0.0 });
  MATS.woodDark    = new THREE.MeshStandardMaterial({ color: 0x4f3a28, roughness: 0.7, metalness: 0.0 });
  MATS.fabricWarm  = new THREE.MeshStandardMaterial({ color: 0xd6cab3, roughness: 0.92, metalness: 0.0 });
  MATS.fabricBlue  = new THREE.MeshStandardMaterial({ color: 0x3a5168, roughness: 0.9, metalness: 0.0 });
  MATS.crateGreen  = new THREE.MeshStandardMaterial({ color: 0x3d7a4a, roughness: 0.6, metalness: 0.1 });
  MATS.crateBlue   = new THREE.MeshStandardMaterial({ color: 0x2f5e8a, roughness: 0.6, metalness: 0.1 });
  MATS.boxKraft    = new THREE.MeshStandardMaterial({ color: 0xc69861, roughness: 0.95, metalness: 0.0 });
  MATS.screen      = new THREE.MeshStandardMaterial({ color: 0x05080d, emissive: 0x1a3a5a, emissiveIntensity: 0.85, roughness: 0.2, metalness: 0.6 });
  MATS.screenBright= new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0x4a90c8, emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.6 });
  MATS.warmLamp    = new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffd590, emissiveIntensity: 0.9, roughness: 0.5 });
  MATS.serverRack  = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.4, metalness: 0.7 });
  MATS.greenery    = new THREE.MeshStandardMaterial({ color: 0x3d6b3a, roughness: 0.95, metalness: 0.0 });
  MATS.signRed     = new THREE.MeshStandardMaterial({ color: 0xc0382c, emissive: 0xc0382c, emissiveIntensity: 0.25, roughness: 0.5 });
}

// ---- mesh helpers ----
export function box(w, h, d, mat, x = 0, y = h / 2, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
export function cyl(r, h, mat, x = 0, y = h / 2, z = 0, segs = 18) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
export function sph(r, mat, x, y, z, segs = 14) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

// ============================================================
// A2 / G2 humanoid robot. The robot in the references has:
//  - sloped helmet head with horizontal visor
//  - white chest shell with central vent grille
//  - black joints, white forearm shells, dark legs
// A2 = primary humanoid (white shell, blue accents)
// G2 = logistics humanoid (white shell, orange accents) — slightly broader chest
// ============================================================
export function makeHumanoid(variant = "A2") {
  const g = new THREE.Group();
  const accent = variant === "G2"
    ? new THREE.MeshStandardMaterial({ color: 0xff7a3a, emissive: 0xff7a3a, emissiveIntensity: 0.15, roughness: 0.5, metalness: 0.4 })
    : new THREE.MeshStandardMaterial({ color: 0x2f6dff, emissive: 0x2f6dff, emissiveIntensity: 0.15, roughness: 0.5, metalness: 0.4 });

  // legs
  g.add(box(0.16, 0.42, 0.18, MATS.robotBlack,  -0.11, 0.21, 0));   // upper L
  g.add(box(0.16, 0.42, 0.18, MATS.robotBlack,   0.11, 0.21, 0));   // upper R
  g.add(sph(0.09, MATS.robotJoint, -0.11, 0.44, 0));                  // knee
  g.add(sph(0.09, MATS.robotJoint,  0.11, 0.44, 0));
  g.add(box(0.14, 0.36, 0.16, MATS.robotBlack, -0.11, 0.62, 0));    // lower L
  g.add(box(0.14, 0.36, 0.16, MATS.robotBlack,  0.11, 0.62, 0));    // lower R
  g.add(box(0.20, 0.06, 0.26, MATS.robotJoint, -0.11, 0.03, 0.04)); // foot L
  g.add(box(0.20, 0.06, 0.26, MATS.robotJoint,  0.11, 0.03, 0.04)); // foot R

  // hips
  g.add(box(0.36, 0.16, 0.22, MATS.robotJoint, 0, 0.88, 0));

  // torso — main white shell (slightly tapered look using two stacked boxes)
  const torsoLower = box(0.42, 0.18, 0.26, MATS.robotWhite, 0, 1.04, 0);
  g.add(torsoLower);
  const torsoMain = box(0.46, 0.34, 0.28, MATS.robotWhite, 0, 1.30, 0);
  g.add(torsoMain);
  // dark central vent grille (signature)
  g.add(box(0.20, 0.24, 0.012, MATS.robotGrille, 0, 1.30, 0.144));
  // grille lines
  for (let i = 0; i < 5; i++) {
    const ln = box(0.18, 0.018, 0.005, MATS.robotBlack, 0, 1.22 + i * 0.04, 0.150);
    g.add(ln);
  }
  // shoulder spans (dark band)
  g.add(box(0.62, 0.10, 0.22, MATS.robotJoint, 0, 1.49, 0));
  // chest accent strip (A2 blue / G2 orange)
  g.add(box(0.30, 0.012, 0.012, accent, 0, 1.43, 0.146));

  // shoulders & arms
  const shY = 1.49;
  g.add(sph(0.10, MATS.robotJoint, -0.31, shY, 0));
  g.add(sph(0.10, MATS.robotJoint,  0.31, shY, 0));
  // upper arms (tapered): use cylinder
  const upArm = (sx) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.32, 14), MATS.robotWhite);
    m.position.set(sx * 0.34, shY - 0.17, 0); m.castShadow = m.receiveShadow = true; return m;
  };
  g.add(upArm(-1), upArm(1));
  // elbows
  g.add(sph(0.07, MATS.robotJoint, -0.34, shY - 0.34, 0));
  g.add(sph(0.07, MATS.robotJoint,  0.34, shY - 0.34, 0));
  // forearms
  const fArm = (sx) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.054, 0.30, 14), MATS.robotWhite);
    m.position.set(sx * 0.34, shY - 0.50, 0.02); m.castShadow = m.receiveShadow = true; return m;
  };
  g.add(fArm(-1), fArm(1));
  // wrists + grippers
  g.add(sph(0.06, MATS.robotJoint, -0.34, shY - 0.66, 0.03));
  g.add(sph(0.06, MATS.robotJoint,  0.34, shY - 0.66, 0.03));
  // hands (paddle-style)
  g.add(box(0.10, 0.12, 0.06, MATS.robotBlack, -0.34, shY - 0.76, 0.04));
  g.add(box(0.10, 0.12, 0.06, MATS.robotBlack,  0.34, shY - 0.76, 0.04));

  // neck + head — sloped helmet
  g.add(cyl(0.05, 0.06, MATS.robotJoint, 0, shY + 0.07, 0, 12));
  // helmet body — tapered slightly forward
  const headBack = box(0.22, 0.22, 0.18, MATS.robotBlack, 0, shY + 0.22, -0.02);
  g.add(headBack);
  // helmet front (white shell) slightly smaller
  const headFront = box(0.21, 0.16, 0.06, MATS.robotWhite, 0, shY + 0.20, 0.10);
  g.add(headFront);
  // horizontal visor strip (signature)
  g.add(box(0.22, 0.045, 0.012, MATS.robotVisor, 0, shY + 0.22, 0.142));
  // tiny eye glints inside visor
  g.add(sph(0.012, MATS.robotEye, -0.05, shY + 0.222, 0.143, 8));
  g.add(sph(0.012, MATS.robotEye,  0.05, shY + 0.222, 0.143, 8));
  // ear / sensor pods
  g.add(sph(0.035, MATS.robotJoint, -0.115, shY + 0.22, 0, 10));
  g.add(sph(0.035, MATS.robotJoint,  0.115, shY + 0.22, 0, 10));

  // overhead safety harness attachment (small loop on top of head)
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 14), MATS.robotJoint);
  loop.position.set(0, shY + 0.36, 0); loop.rotation.x = Math.PI / 2;
  loop.castShadow = true; g.add(loop);

  g.userData.kind = "robot";
  g.userData.variant = variant;
  return g;
}

// ============================================================
// Operator with VR headset + minimal exoskeleton backpack (refs)
// ============================================================
export function makeOperator(opts = {}) {
  const g = new THREE.Group();
  const shirt = opts.shirt || MATS.opShirt;
  const pants = opts.pants || MATS.opPants;

  // legs
  g.add(cyl(0.085, 0.84, pants, -0.10, 0.42, 0, 12));
  g.add(cyl(0.085, 0.84, pants,  0.10, 0.42, 0, 12));
  // shoes
  g.add(box(0.13, 0.06, 0.22, MATS.robotBlack, -0.10, 0.03, 0.04));
  g.add(box(0.13, 0.06, 0.22, MATS.robotBlack,  0.10, 0.03, 0.04));
  // hips
  g.add(box(0.30, 0.10, 0.22, pants, 0, 0.86, 0));
  // torso
  g.add(box(0.40, 0.58, 0.26, shirt, 0, 1.18, 0));
  // backpack (exoskeleton box)
  g.add(box(0.34, 0.40, 0.16, MATS.opVest, 0, 1.20, -0.20));
  g.add(box(0.30, 0.06, 0.04, MATS.equipDark, 0, 1.32, -0.29));
  // exoskeleton arm rails (over each shoulder)
  for (const side of [-1, 1]) {
    g.add(box(0.05, 0.10, 0.30, MATS.opVest, side * 0.20, 1.45, -0.05));
    g.add(box(0.04, 0.05, 0.20, MATS.headset, side * 0.20, 1.42, 0.18));
  }
  // shoulder straps
  g.add(box(0.05, 0.50, 0.04, MATS.opVest, -0.15, 1.18, 0.13));
  g.add(box(0.05, 0.50, 0.04, MATS.opVest,  0.15, 1.18, 0.13));

  // ARMS — teleop pose: upper arm vertical, forearm forward at ~90°, hands holding controllers
  for (const side of [-1, 1]) {
    const sx = side * 0.25;
    // upper arm (shorter, vertical)
    g.add(cyl(0.06, 0.30, shirt, sx, 1.32, 0.02, 10));
    // elbow
    g.add(sph(0.06, shirt, sx, 1.17, 0.02, 10));
    // forearm — horizontal, forward
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.30, 10), shirt);
    fa.position.set(sx - side * 0.02, 1.13, 0.20);
    fa.rotation.x = Math.PI / 2;
    fa.castShadow = fa.receiveShadow = true;
    g.add(fa);
    // hand
    g.add(sph(0.052, MATS.opSkin, sx - side * 0.04, 1.10, 0.34, 10));
    // VR controller (dark box with LED ring on top)
    g.add(box(0.07, 0.10, 0.12, MATS.headset, sx - side * 0.04, 1.07, 0.42));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16), MATS.headsetLens);
    ring.position.set(sx - side * 0.04, 1.14, 0.42); ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    g.add(ring);
  }

  // neck
  g.add(cyl(0.042, 0.06, MATS.opSkin, 0, 1.51, 0, 10));
  // head (skin)
  g.add(sph(0.105, MATS.opSkin, 0, 1.59, 0, 14));
  // hair cap on back/top
  g.add(box(0.20, 0.10, 0.18, MATS.opHair, 0, 1.65, -0.02));
  // VR headset wrapping front of face
  g.add(box(0.21, 0.10, 0.13, MATS.headset, 0, 1.60, 0.05));
  // visor lens
  g.add(box(0.19, 0.06, 0.01, MATS.headsetLens, 0, 1.60, 0.115));
  // strap over top
  g.add(box(0.04, 0.10, 0.20, MATS.headset, 0, 1.66, 0.00));

  g.userData.kind = "operator";
  return g;
}

// Simple seated operator silhouette (operator area)
export function makeSeatedOperator() {
  const g = new THREE.Group();
  g.add(box(0.36, 0.45, 0.30, MATS.opShirt, 0, 0.85, 0));        // torso (seated higher)
  g.add(cyl(0.07, 0.42, MATS.opPants, -0.10, 0.55, 0.18, 10));   // upper legs forward
  g.add(cyl(0.07, 0.42, MATS.opPants,  0.10, 0.55, 0.18, 10));
  g.add(sph(0.10, MATS.opSkin, 0, 1.20, 0, 12));                   // head
  g.add(box(0.16, 0.08, 0.14, MATS.opHair, 0, 1.25, -0.02));       // hair
  g.userData.kind = "operator";
  return g;
}

// ============================================================
// Overhead gantry per station: 4 white posts + frame at 3.0m with
// hanging LED bar, RGB-D camera, safety harness cable
// ============================================================
export function makeStationGantry(w, d) {
  const g = new THREE.Group();
  const H = 3.1;
  const postR = 0.04;
  const corners = [
    [-w/2 + 0.15, -d/2 + 0.15], [ w/2 - 0.15, -d/2 + 0.15],
    [-w/2 + 0.15,  d/2 - 0.15], [ w/2 - 0.15,  d/2 - 0.15],
  ];
  for (const [x, z] of corners) {
    g.add(cyl(postR, H, MATS.gantry, x, H/2, z, 10));
    g.add(box(0.10, 0.06, 0.10, MATS.gantryBlue, x, H + 0.05, z));   // top cap
  }
  // top frame (white square)
  const fT = 0.05;
  g.add(box(w - 0.10, fT, 0.08, MATS.gantry, 0, H, -d/2 + 0.15));
  g.add(box(w - 0.10, fT, 0.08, MATS.gantry, 0, H,  d/2 - 0.15));
  g.add(box(0.08, fT, d - 0.10, MATS.gantry, -w/2 + 0.15, H, 0));
  g.add(box(0.08, fT, d - 0.10, MATS.gantry,  w/2 - 0.15, H, 0));
  // blue stripe accent
  g.add(box(w - 0.4, 0.02, 0.04, MATS.gantryBlue, 0, H - 0.06, -d/2 + 0.16));
  g.add(box(w - 0.4, 0.02, 0.04, MATS.gantryBlue, 0, H - 0.06,  d/2 - 0.16));
  // hanging LED bar — long linear strip under the gantry along the diagonal/cross
  const led = box(w - 0.8, 0.04, 0.08, MATS.ledStrip, 0, H - 0.10, 0);
  g.add(led);
  // perpendicular short LED
  g.add(box(0.08, 0.04, d - 0.8, MATS.ledStrip, w * 0.18, H - 0.10, 0));
  // overhead RGB-D camera — small box on white arm
  const armX = w * 0.0, armZ = d * 0.0;
  g.add(box(0.06, 0.30, 0.06, MATS.gantry, armX, H - 0.15, armZ - 0.5));
  const cam = box(0.18, 0.10, 0.14, MATS.camHousing, armX, H - 0.35, armZ - 0.5);
  g.add(cam);
  g.add(cyl(0.035, 0.04, MATS.camLens, armX, H - 0.45, armZ - 0.5, 14));
  // safety harness cable from frame down (above robot zone)
  const cable = cyl(0.012, H - 1.7, MATS.cable, armX + 0.6, (H - 1.7)/2 + 1.7, armZ - 0.0, 6);
  g.add(cable);
  // harness hook
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), MATS.robotJoint).translateX(armX + 0.6).translateY(1.78).translateZ(armZ));
  // cable management trough overhead
  g.add(box(0.12, 0.06, d - 0.4, MATS.gantryBlue, -w/2 + 0.25, H - 0.05, 0));

  g.userData.kind = "gantry";
  return g;
}

// ============================================================
// Data terminal — small wheeled cart with laptop/monitor
// ============================================================
export function makeDataTerminal() {
  const g = new THREE.Group();
  g.add(box(0.50, 0.78, 0.38, MATS.equipDark, 0, 0.39, 0));        // cart body
  g.add(box(0.54, 0.04, 0.42, MATS.steel, 0, 0.81, 0));             // top
  for (let i = 0; i < 4; i++) g.add(cyl(0.04, 0.05, MATS.robotBlack, -0.20 + (i%2)*0.40, 0.025, -0.15 + Math.floor(i/2)*0.30, 10));
  // monitor
  g.add(box(0.42, 0.28, 0.04, MATS.screen, 0, 1.05, -0.08));
  g.add(box(0.06, 0.20, 0.06, MATS.equipDark, 0, 0.91, -0.08));
  // laptop (open)
  const lap = box(0.32, 0.02, 0.22, MATS.equipDark, 0, 0.84, 0.08);
  g.add(lap);
  const lid = box(0.32, 0.20, 0.02, MATS.screenBright, 0, 0.94, -0.02);
  lid.rotation.x = -0.25;
  lid.castShadow = lid.receiveShadow = true;
  g.add(lid);
  // small box & papers
  g.add(box(0.12, 0.05, 0.10, MATS.boxKraft, -0.18, 0.86, 0.10));
  return g;
}

// ============================================================
// Hazard tape: 5cm-wide rectangle border drawn as 4 strips
// ============================================================
export function makeHazardTape(w, d) {
  const g = new THREE.Group();
  const t = 0.16; // strip width
  const inset = 0.05; // from outer edge of station floor
  // top/bottom
  g.add(box(w - 2*inset, 0.01, t, MATS.hazard, 0, 0.012, -d/2 + inset + t/2));
  g.add(box(w - 2*inset, 0.01, t, MATS.hazard, 0, 0.012,  d/2 - inset - t/2));
  // left/right
  g.add(box(t, 0.01, d - 2*inset - 2*t, MATS.hazard, -w/2 + inset + t/2, 0.012, 0));
  g.add(box(t, 0.01, d - 2*inset - 2*t, MATS.hazard,  w/2 - inset - t/2, 0.012, 0));
  return g;
}
