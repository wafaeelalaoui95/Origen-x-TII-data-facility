// ============================================================
// ORIGEN x TII Data Collection Facility — Main entry
// Two stacked floors, each with an operations block + service core.
//   Floor 1 — Industrial : Logistics · Security · Locomotion + support + core
//   Floor 2 — Domestic   : F&B · Home + support + core
// ============================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { STATIONS, CATEGORIES, CATEGORY_ORDER, FACILITY, FLOOR_LABELS } from "./stations.js";
import { BUILDING, FLOOR_H, getSupportPlacement, getCoreRooms } from "./layout.js";
import {
  buildMaterials, MATS,
  buildShellFloor, buildSite, buildSupportRooms, buildCore, buildWanderers,
  buildStation, stationCenter,
  getStationZoneLabels, getSupportZoneLabels, getCoreZoneLabels,
} from "./facility.js";
import { animateRobotIdle } from "./robot.js";

// ---- DOM refs ------------------------------------------------------------
const sceneEl  = document.getElementById("scene");
const labelsEl = document.getElementById("labels");
const panelEl  = document.getElementById("panel");
const hintEl   = document.getElementById("hint");
const loaderEl = document.getElementById("loader");
const minimapMap = document.getElementById("minimap-map");
const searchInput = document.getElementById("search-input");
const pickerEl = document.getElementById("picker");
const pickerTitleEl = document.getElementById("picker-title");
const pickerListEl = document.getElementById("picker-list");

// ---- Renderer / scene ----------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd9f0);
scene.fog = new THREE.Fog(0xbfd9f0, 150, 520);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

buildMaterials();

const MAXDIM = Math.max(BUILDING.totalW, BUILDING.totalD);
const EXPLODE_Y = FLOOR_H + 6.0;

// ---- Camera --------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.5, 1000);
const VIEWS = {
  f1:   { pos: new THREE.Vector3(0.5 * BUILDING.totalW, 1.05 * MAXDIM, 0.92 * BUILDING.totalD), tgt: new THREE.Vector3(0, 0, 0) },
  f2:   { pos: new THREE.Vector3(0.5 * BUILDING.totalW, 1.05 * MAXDIM + FLOOR_H, 0.92 * BUILDING.totalD), tgt: new THREE.Vector3(0, FLOOR_H, 0) },
  both: { pos: new THREE.Vector3(0.18 * BUILDING.totalW, 0.72 * MAXDIM + EXPLODE_Y, 1.44 * BUILDING.totalD), tgt: new THREE.Vector3(0, EXPLODE_Y * 0.46, 0) },
};
camera.position.copy(VIEWS.f1.pos);
camera.lookAt(VIEWS.f1.tgt);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(VIEWS.f1.tgt);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 6;
controls.maxDistance = 340;
controls.maxPolarAngle = Math.PI / 2.04;

// ---- Lighting ------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xcbd6df, 0x1d1916, 0.55));
const sun = new THREE.DirectionalLight(0xfff0d6, 2.5);
sun.position.set(55, 120, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sd = MAXDIM * 0.85;
sun.shadow.camera.left = -sd; sun.shadow.camera.right = sd;
sun.shadow.camera.top = sd;   sun.shadow.camera.bottom = -sd;
sun.shadow.camera.near = 10;  sun.shadow.camera.far = 360;
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8fb7d8, 0.45);
fill.position.set(-60, 55, -40);
scene.add(fill);
scene.add(new THREE.AmbientLight(0xffffff, 0.20));

// ---- Build world ---------------------------------------------------------
const world = new THREE.Group();
scene.add(world);
world.add(buildSite());

const stationNodes = []; // { root, station, ringMat, gantry, floor, group }
function buildFloorGroup(floorNum) {
  const g = new THREE.Group();
  const shell = buildShellFloor(floorNum - 1);
  g.add(shell);
  g.add(buildCore(floorNum));
  g.add(buildSupportRooms(floorNum));
  for (const s of STATIONS.filter((x) => x.floor === floorNum)) {
    const node = buildStation(s);
    g.add(node);
    stationNodes.push({ root: node, station: s, ringMat: node.userData.ringMat, gantry: node.userData.gantry, floor: floorNum, group: g });
  }
  g.add(buildWanderers());
  g.userData.shell = shell;
  return g;
}
const floor1 = buildFloorGroup(1);
const floor2 = buildFloorGroup(2);
floor2.position.y = FLOOR_H;
world.add(floor1, floor2);
const groupOf = (f) => (f === 1 ? floor1 : floor2);
const floorY = (f) => (f === 1 ? 0 : floor2.position.y);

// ---- Detail shading ------------------------------------------------------
function setObjectShade(root, shaded) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (shaded) {
      if (!o.userData.originalMaterial) o.userData.originalMaterial = o.material;
      if (!o.userData.shadeMaterial) o.userData.shadeMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1015, roughness: 0.86, metalness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });
      o.material = o.userData.shadeMaterial; o.castShadow = false;
    } else if (o.userData.originalMaterial) { o.material = o.userData.originalMaterial; o.castShadow = true; }
  });
}
function applyDetailShading(on, focusNode = null) {
  const grp = focusNode ? focusNode.group : null;
  for (const g of [floor1, floor2]) g.traverse((o) => {
    if (o.userData?.detailShade) {
      const belongs = focusNode && (focusNode.root === o.parent || focusNode.root.children.includes(o));
      setObjectShade(o, on && g === grp && !belongs);
    }
  });
}

// ---- Floating labels -----------------------------------------------------
const tags = [];
function makeTag(s, node) {
  const el = document.createElement("div");
  el.className = "tag";
  el.style.color = CATEGORIES[s.category].css;
  el.innerHTML = `<span class="num">${s.code}${s.robots > 1 ? ` ×${s.robots}` : ""}</span>`;
  el.addEventListener("click", () => selectStation(node));
  el.addEventListener("mouseenter", () => setHover(node));
  el.addEventListener("mouseleave", () => setHover(null));
  labelsEl.appendChild(el);
  return el;
}
for (const node of stationNodes) {
  const c = stationCenter(node.station);
  tags.push({ el: makeTag(node.station, node), x: c.x, z: c.z, localY: 2.4, node, station: node.station, floor: node.floor });
}

const zoneLabels = [];
function addZoneLabel(z, floor, cls = "room-label") {
  const el = document.createElement("div");
  el.className = cls; el.textContent = z.label;
  labelsEl.appendChild(el);
  zoneLabels.push({ el, x: z.x ?? z.cx, z: z.z ?? z.cz, localY: z.localY ?? 0.1, floor });
}
for (const fl of [1, 2]) {
  for (const z of getStationZoneLabels(fl)) addZoneLabel(z, fl);
  for (const z of getSupportZoneLabels(fl)) addZoneLabel(z, fl);
  for (const z of getCoreZoneLabels(fl)) addZoneLabel({ ...z, localY: 0.1 }, fl, "room-label core-label");
}

// ---- Floor mode ----------------------------------------------------------
let floorMode = "f1";
function applyFloorMode(mode, fly = true) {
  floorMode = mode;
  floor1.visible = mode === "f1" || mode === "both";
  floor2.visible = mode === "f2" || mode === "both";
  floor2.position.y = mode === "both" ? EXPLODE_Y : FLOOR_H;
  refreshTagsVisibility();
  for (const z of zoneLabels) {
    const show = mode === "both" ? true : (z.floor === (mode === "f1" ? 1 : 2));
    z.el.classList.toggle("layer-off", !show);
  }
  buildMinimap();
  const idFor = { f1: "btn-floor-data", f2: "btn-floor-support", both: "btn-floor-both" };
  for (const id of ["btn-floor-data", "btn-floor-support", "btn-floor-both"]) document.getElementById(id)?.classList.toggle("primary", id === idFor[mode]);
  if (fly) { clearSelection(false); const v = VIEWS[mode] || VIEWS.f1; flyTo(v.pos, v.tgt, 1200); }
}

// ---- Minimap -------------------------------------------------------------
let minimapViewport;
function buildMinimap() {
  minimapMap.innerHTML = "";
  const w = minimapMap.clientWidth, h = minimapMap.clientHeight;
  const ox = -BUILDING.totalW / 2, oz = -BUILDING.totalD / 2;
  const sx = (px, pz) => ({ x: ((px - ox) / BUILDING.totalW) * w, y: ((pz - oz) / BUILDING.totalD) * h });
  const rect = (cx, cz, rw, rd, bg, op = 0.55) => {
    const p1 = sx(cx - rw / 2, cz - rd / 2), p2 = sx(cx + rw / 2, cz + rd / 2);
    const div = document.createElement("div"); div.className = "zone";
    div.style.left = p1.x + "px"; div.style.top = p1.y + "px";
    div.style.width = (p2.x - p1.x - 1) + "px"; div.style.height = (p2.y - p1.y - 1) + "px";
    div.style.background = bg; div.style.opacity = op; minimapMap.appendChild(div);
  };
  const fl = floorMode === "f2" ? 2 : 1;
  for (const z of getCoreRooms(fl)) rect(z.cx, z.cz, z.w, z.d, "#2b3340", 0.5);
  for (const z of getSupportPlacement(fl)) rect(z.cx, z.cz, z.w, z.d, "#3a4252", 0.5);
  for (const node of stationNodes.filter((n) => n.floor === fl)) {
    const c = stationCenter(node.station);
    rect(c.x, c.z, c.w, c.d, CATEGORIES[node.station.category].css, 0.75);
  }
  const vp = document.createElement("div"); vp.className = "viewport"; minimapMap.appendChild(vp); minimapViewport = vp;
}
function updateMinimap() {
  if (!minimapViewport) return;
  const w = minimapMap.clientWidth, h = minimapMap.clientHeight;
  const t = controls.target;
  const radius = camera.position.distanceTo(t) * 0.5;
  const ox = -BUILDING.totalW / 2, oz = -BUILDING.totalD / 2;
  const px = ((t.x - ox) / BUILDING.totalW) * w, py = ((t.z - oz) / BUILDING.totalD) * h;
  const vw = Math.min(w * 0.9, (radius / BUILDING.totalW) * w * 0.8);
  const vh = Math.min(h * 0.9, (radius / BUILDING.totalD) * h * 0.8);
  minimapViewport.style.left = (px - vw / 2) + "px"; minimapViewport.style.top = (py - vh / 2) + "px";
  minimapViewport.style.width = vw + "px"; minimapViewport.style.height = vh + "px";
}

// ---- Raycasting ----------------------------------------------------------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickIndex = new Map(); // mesh → node
for (const node of stationNodes) for (const p of node.root.userData.pickables) pickIndex.set(p, node);
const allPickables = [...pickIndex.keys()];
function pickAt(x, y) {
  ndc.x = (x / window.innerWidth) * 2 - 1; ndc.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(allPickables, false);
  for (const hit of hits) {
    const node = pickIndex.get(hit.object) || hit.object.userData.pickTarget?.userData;
    const n = pickIndex.get(hit.object);
    if (n && groupOf(n.floor).visible) return n;
  }
  return null;
}

let hoverNode = null, selectedNode = null, searchTerm = "";
function setHover(node) {
  if (hoverNode === node) return;
  if (hoverNode && hoverNode !== selectedNode) hoverNode.ringMat.opacity = 0;
  hoverNode = node;
  if (hoverNode) { hoverNode.ringMat.opacity = hoverNode === selectedNode ? 0.6 : 0.30; sceneEl.classList.add("hovering"); }
  else sceneEl.classList.remove("hovering");
}
renderer.domElement.addEventListener("mousemove", (e) => setHover(pickAt(e.clientX, e.clientY)));
renderer.domElement.addEventListener("click", (e) => {
  if (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) > 4) return;
  const node = pickAt(e.clientX, e.clientY);
  if (node) selectStation(node);
});

// ---- Camera tween --------------------------------------------------------
let tween = null;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(pos, tgt, dur = 1200) { tween = { t: 0, dur, fromPos: camera.position.clone(), fromTgt: controls.target.clone(), toPos: pos.clone(), toTgt: tgt.clone() }; }

// ---- Detail mode ---------------------------------------------------------
let detailMode = false;
function setDetailMode(on, focusNode = null) {
  detailMode = on;
  labelsEl.classList.toggle("detail-mode", on);
  const grp = focusNode ? focusNode.group : null;
  for (const g of [floor1, floor2]) {
    const shell = g.userData.shell;
    shell?.traverse((o) => { if (o.isMesh && (o.material === MATS.wallWhite || o.material === MATS.wallTrim)) o.visible = !(on && g === grp); });
  }
  for (const node of stationNodes) { if (node.gantry) node.gantry.visible = !on || node === focusNode; }
  applyDetailShading(on, focusNode);
}

function selectStation(node) {
  const targetMode = node.floor === 1 ? "f1" : "f2";
  if (floorMode !== targetMode) applyFloorMode(targetMode, false);
  if (selectedNode) { selectedNode.ringMat.opacity = 0; tagFor(selectedNode)?.classList.remove("selected"); }
  selectedNode = node;
  const s = node.station, c = stationCenter(s), gy = floorY(node.floor);
  tagFor(node)?.classList.add("selected");
  node.ringMat.opacity = 0.55;
  const dist = Math.max(8, c.w);
  const pos = new THREE.Vector3(c.x + Math.cos(Math.PI * 0.75) * dist, gy + dist * 0.7 + 2.0, c.z + Math.sin(Math.PI * 0.75) * dist + 4.0);
  flyTo(pos, new THREE.Vector3(c.x, gy + 1.0, c.z), 1100);
  setDetailMode(true, node);
  openPanel(s);
  hideHint();
}
function tagFor(node) { return tags.find((t) => t.node === node)?.el; }
function clearSelection(closePanelToo = true) {
  if (selectedNode) { selectedNode.ringMat.opacity = 0; tagFor(selectedNode)?.classList.remove("selected"); selectedNode = null; }
  if (closePanelToo) closePanel();
  setDetailMode(false);
}

// ---- Info panel ----------------------------------------------------------
function openPanel(s) {
  panelEl.classList.add("open");
  const cat = CATEGORIES[s.category];
  panelEl.querySelector(".preview").style.color = cat.css;
  panelEl.querySelector(".id").textContent = `STATION ${s.code}  ·  FLOOR ${s.floor}  ·  ${s.difficulty.toUpperCase()}`;
  const catEl = panelEl.querySelector(".cat"); catEl.textContent = cat.label; catEl.style.background = cat.css;
  panelEl.querySelector(".name").textContent = s.name;
  panelEl.querySelector(".desc").textContent = s.objective;
  panelEl.querySelector("#kv-robot").innerHTML = `<b>${s.robot === "G2" ? "G2 wheeled robot" : "A2 humanoid"}</b>`;
  panelEl.querySelector("#kv-count").textContent = `${s.robots} robot${s.robots > 1 ? "s" : ""} · ${s.operators} operator${s.operators > 1 ? "s" : ""}`;
  panelEl.querySelector("#kv-area").textContent = `${s.area} m²`;
  panelEl.querySelector("#kv-status").innerHTML = `<span class="dot"></span> Floor ${s.floor} · ${s.floor === 1 ? "Industrial" : "Domestic"}`;
  const eq = panelEl.querySelector("#chips-eq"); eq.innerHTML = "";
  for (const e of s.equipment) { const c = document.createElement("span"); c.className = "chip"; c.textContent = e; eq.appendChild(c); }
  const sn = panelEl.querySelector("#chips-sn"); sn.innerHTML = "";
  for (const e of s.sensors) { const c = document.createElement("span"); c.className = "chip"; c.textContent = e; sn.appendChild(c); }
  const seed = s.id;
  panelEl.querySelector("#m-ep").textContent = (120 + (seed * 37) % 380).toLocaleString();
  panelEl.querySelector("#m-hr").textContent = (200 + (seed * 53) % 1400).toLocaleString();
  panelEl.querySelector("#m-ac").textContent = (12 + (seed * 3) % 8) + "%";
}
function closePanel() { panelEl.classList.remove("open"); }
panelEl.querySelector(".close").addEventListener("click", () => { clearSelection(); applyFloorMode(floorMode); });

// ---- Legend + stats ------------------------------------------------------
function refreshTagsVisibility() {
  for (const t of tags) {
    const floorVisible = groupOf(t.floor).visible;
    if (!floorVisible) { t.el.classList.add("hidden"); continue; }
    const match = !searchTerm || t.station.name.toLowerCase().includes(searchTerm) || t.station.code.toLowerCase().includes(searchTerm);
    if (match) t.el.classList.remove("hidden", "dimmed");
    else { t.el.classList.add("dimmed"); t.el.classList.remove("hidden"); }
  }
}
function setupLegend() {
  const legend = document.getElementById("legend-rows");
  legend.innerHTML = "";
  for (const id of CATEGORY_ORDER) {
    const cat = CATEGORIES[id];
    const list = STATIONS.filter((s) => s.category === id);
    const robotCount = list.reduce((a, s) => a + s.robots, 0);
    const fl = list[0]?.floor;
    const row = document.createElement("div");
    row.className = "row"; row.dataset.id = id;
    row.innerHTML = `<div class="left"><span class="swatch" style="background:${cat.css}"></span><span class="label">${cat.label}</span></div><span class="count">F${fl} · ${list.length}st · ${robotCount}bot</span>`;
    row.title = `Floor ${fl} · ${list.length} stations · ${robotCount} robots`;
    row.addEventListener("click", () => openStationPicker(id));
    legend.appendChild(row);
  }
}
setupLegend();
function setupStats() {
  const a2 = STATIONS.filter((s) => s.robot === "A2").reduce((a, s) => a + s.robots, 0);
  const g2 = STATIONS.filter((s) => s.robot === "G2").reduce((a, s) => a + s.robots, 0);
  const ops = STATIONS.reduce((a, s) => a + s.operators, 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-stations", STATIONS.length); set("stat-a2", a2); set("stat-g2", g2); set("stat-tii", 0);
  set("stat-ops", ops); set("stat-area", `${FACILITY.totalSqm} m²`);
  const meta = document.getElementById("meta-counts");
  if (meta) meta.textContent = `${STATIONS.length} STATIONS · ${a2 + g2} ROBOTS · 2 FLOORS`;
}
setupStats();

// ---- Station picker ------------------------------------------------------
function closeStationPicker() { pickerEl.classList.add("hidden"); }
function openStationPicker(categoryId = "all") {
  const byCat = categoryId !== "all";
  const cats = byCat ? [categoryId] : CATEGORY_ORDER;
  pickerTitleEl.textContent = byCat ? CATEGORIES[categoryId].label : "All Stations";
  pickerListEl.innerHTML = "";
  for (const catId of cats) {
    const rows = stationNodes.filter((n) => n.station.category === catId);
    if (!rows.length) continue;
    const cat = CATEGORIES[catId];
    if (!byCat) { const head = document.createElement("div"); head.className = "picker-cat"; head.innerHTML = `<span class="swatch" style="background:${cat.css}"></span>${cat.label} · Floor ${rows[0].floor}`; pickerListEl.appendChild(head); }
    for (const node of rows) {
      const s = node.station;
      const row = document.createElement("button");
      row.className = "picker-row"; row.type = "button"; row.style.setProperty("--row-color", cat.css);
      row.innerHTML = `<span class="code">${s.code}</span><span class="name">${s.name}</span><span class="robot">${s.robots > 1 ? `${s.robot} ×${s.robots}` : s.robot}</span>`;
      row.addEventListener("click", () => { closeStationPicker(); selectStation(node); });
      pickerListEl.appendChild(row);
    }
  }
  pickerEl.classList.remove("hidden");
}
pickerEl.querySelector(".picker-close").addEventListener("click", closeStationPicker);
searchInput.addEventListener("input", (e) => { searchTerm = e.target.value.trim().toLowerCase(); refreshTagsVisibility(); });

// ---- Controls ------------------------------------------------------------
document.getElementById("btn-floor-data").addEventListener("click", () => applyFloorMode("f1"));
document.getElementById("btn-floor-support").addEventListener("click", () => applyFloorMode("f2"));
document.getElementById("btn-floor-both").addEventListener("click", () => applyFloorMode("both"));
document.getElementById("btn-back").addEventListener("click", () => { clearSelection(); applyFloorMode(floorMode); });
for (const b of document.querySelectorAll(".topbar nav button")) {
  b.addEventListener("click", () => {
    document.querySelectorAll(".topbar nav button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    const v = b.dataset.view;
    if (v === "data") applyFloorMode("f1");
    else if (v === "support") applyFloorMode("f2");
    else if (v === "both") applyFloorMode("both");
    else if (v === "stations") openStationPicker("all");
  });
}
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeStationPicker(); clearSelection(); applyFloorMode(floorMode); } });
window.addEventListener("resize", () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

// ---- Project 3D → screen for labels --------------------------------------
const _v = new THREE.Vector3();
function projectLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const t of tags) {
    if (t.el.classList.contains("hidden")) { t.el.style.display = "none"; continue; }
    _v.set(t.x, floorY(t.floor) + t.localY, t.z).project(camera);
    if (_v.z > 1) { t.el.style.display = "none"; continue; }
    t.el.style.display = "";
    t.el.style.transform = `translate(${(_v.x * 0.5 + 0.5) * w}px, ${(-_v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
  }
  for (const z of zoneLabels) {
    if (z.el.classList.contains("layer-off")) continue;
    _v.set(z.x, floorY(z.floor) + z.localY, z.z).project(camera);
    if (_v.z > 1) { z.el.style.display = "none"; continue; }
    z.el.style.display = "";
    z.el.style.transform = `translate(${(_v.x * 0.5 + 0.5) * w}px, ${(-_v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`;
  }
}

// ---- Robot idle ----------------------------------------------------------
const robotGroups = [];
world.traverse((o) => { if (o.userData?.kind === "robot") robotGroups.push(o); });
const robotPhase = robotGroups.map(() => Math.random() * Math.PI * 2);

let hintHidden = false;
function hideHint() { if (hintHidden) return; hintHidden = true; hintEl.classList.add("hidden"); }
setTimeout(hideHint, 9000);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (tween) {
    tween.t += dt * 1000;
    const e = easeInOutCubic(Math.min(tween.t / tween.dur, 1));
    camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
    controls.target.lerpVectors(tween.fromTgt, tween.toTgt, e);
    if (tween.t / tween.dur >= 1) tween = null;
  }
  controls.update();
  if (selectedNode) selectedNode.ringMat.opacity = 0.42 + Math.sin(t * 3.4) * 0.18;
  for (let i = 0; i < robotGroups.length; i++) animateRobotIdle(robotGroups[i], t, robotPhase[i]);
  renderer.render(scene, camera);
  projectLabels();
  updateMinimap();
}

applyFloorMode("f1", false);
buildMinimap();
animate();
renderer.render(scene, camera);
setTimeout(() => loaderEl.classList.add("hidden"), 600);

// headless capture hook
window.__twin = {
  render: () => renderer.render(scene, camera),
  frame: () => { controls.update(); renderer.render(scene, camera); projectLabels(); updateMinimap(); },
  view: (m) => { applyFloorMode(m, true); if (tween) { camera.position.copy(tween.toPos); controls.target.copy(tween.toTgt); tween = null; } controls.update(); renderer.render(scene, camera); projectLabels(); },
  selectByCode: (code) => { const n = stationNodes.find((x) => x.station.code === code); if (n) { selectStation(n); if (tween) { camera.position.copy(tween.toPos); controls.target.copy(tween.toTgt); tween = null; } controls.update(); renderer.render(scene, camera); projectLabels(); } },
};
