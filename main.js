// ============================================================
// ORIGEN Robotics Data Collection Facility — Main entry
// ============================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { STATIONS, CATEGORIES, LAYOUT } from "./stations.js";
import {
  buildMaterials, MATS,
  buildShell, buildOperatorArea, buildServerRoom, buildWanderers,
  buildStation, getFloorPlan, getZoneLabels, stationCenter,
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

// ---- Renderer / scene / camera ------------------------------------------
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
scene.background = new THREE.Color(0x0a0c10);
scene.fog = new THREE.Fog(0x0a0c10, 90, 260);

// Environment for nice PBR reflections
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// build materials before any builder
buildMaterials();
const FP = getFloorPlan();

// ---- Camera --------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(36, window.innerWidth/window.innerHeight, 0.5, 800);
// Roof-off architectural cutaway view from above front-right
const OVERVIEW = {
  pos: new THREE.Vector3(0.55 * FP.totalW, 1.05 * Math.max(FP.totalW, FP.totalD), 0.85 * FP.totalD),
  tgt: new THREE.Vector3(0, 0, 0),
};
camera.position.copy(OVERVIEW.pos);
camera.lookAt(OVERVIEW.tgt);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(OVERVIEW.tgt);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 6;
controls.maxDistance = 260;
controls.maxPolarAngle = Math.PI / 2.04;
controls.enablePan = true;

// ---- Lighting ------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0xcbd6df, 0x1d1916, 0.55);
scene.add(hemi);

// sun
const sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
sun.position.set(45, 90, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sd = Math.max(FP.totalW, FP.totalD) * 0.75;
sun.shadow.camera.left = -sd; sun.shadow.camera.right = sd;
sun.shadow.camera.top = sd;   sun.shadow.camera.bottom = -sd;
sun.shadow.camera.near = 10;  sun.shadow.camera.far = 280;
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun);

// fill
const fill = new THREE.DirectionalLight(0x8fb7d8, 0.45);
fill.position.set(-55, 45, -35);
scene.add(fill);

// ambient lift
scene.add(new THREE.AmbientLight(0xffffff, 0.20));

// ---- Build world ---------------------------------------------------------
const world = new THREE.Group();
scene.add(world);

const shell = buildShell();
world.add(shell);
const opArea = buildOperatorArea();
world.add(opArea);
const serverRoom = buildServerRoom();
world.add(serverRoom);

const stationNodes = []; // { idx, root, station, ringMat }
for (let i = 0; i < STATIONS.length; i++) {
  const s = STATIONS[i];
  const node = buildStation(s, i);
  world.add(node);
  stationNodes.push({ idx: i, root: node, station: s, ringMat: node.userData.ringMat, gantry: node.userData.gantry });
}

world.add(buildWanderers());

function setObjectShade(root, shaded) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (shaded) {
      if (!o.userData.originalMaterial) o.userData.originalMaterial = o.material;
      if (!o.userData.shadeMaterial) {
        o.userData.shadeMaterial = new THREE.MeshStandardMaterial({
          color: 0x0d1015,
          roughness: 0.86,
          metalness: 0.05,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        });
      }
      o.material = o.userData.shadeMaterial;
      o.castShadow = false;
    } else if (o.userData.originalMaterial) {
      o.material = o.userData.originalMaterial;
      o.castShadow = true;
    }
  });
}

function applyDetailShading(on, focusIdx = -1) {
  world.traverse((o) => {
    if (o.userData?.detailShade) {
      const stationRoot = stationNodes.find((node) => node.root === o.parent || node.root.children.includes(o));
      const belongsToFocus = stationRoot?.idx === focusIdx;
      setObjectShade(o, on && !belongsToFocus);
    }
  });
}

// ---- Floating labels ----------------------------------------------------
const tags = [];
function makeTag(s, idx) {
  const el = document.createElement("div");
  el.className = "tag";
  el.style.color = CATEGORIES[s.category].css;
  el.innerHTML = `<span class="num">${s.code}</span>`;
  el.dataset.idx = idx;
  el.dataset.cat = s.category;
  el.dataset.name = s.name.toLowerCase();
  el.dataset.code = s.code.toLowerCase();
  el.addEventListener("click", () => selectStation(idx));
  el.addEventListener("mouseenter", () => setHover(idx));
  el.addEventListener("mouseleave", () => setHover(-1));
  labelsEl.appendChild(el);
  return el;
}
for (let i = 0; i < STATIONS.length; i++) {
  const s = STATIONS[i];
  const c = stationCenter(i);
  tags.push({
    el: makeTag(s, i),
    world: new THREE.Vector3(c.x, 2.3, c.z),
    idx: i, station: s, category: s.category,
  });
}

// zone labels
const zoneLabels = [];
for (const z of getZoneLabels()) {
  const el = document.createElement("div");
  el.className = "room-label";
  el.textContent = z.label;
  labelsEl.appendChild(el);
  zoneLabels.push({ el, world: new THREE.Vector3(z.x, z.y, z.z) });
}

// ---- Minimap -------------------------------------------------------------
function buildMinimap() {
  minimapMap.innerHTML = "";
  const w = minimapMap.clientWidth, h = minimapMap.clientHeight;
  const sx = (px, pz) => ({ x: ((px - FP.origin.x) / FP.totalW) * w, y: ((pz - FP.origin.z) / FP.totalD) * h });
  // station cells
  for (let i = 0; i < STATIONS.length; i++) {
    const c = stationCenter(i);
    const p1 = sx(c.x - c.w/2, c.z - c.d/2);
    const p2 = sx(c.x + c.w/2, c.z + c.d/2);
    const div = document.createElement("div");
    div.className = "zone"; div.dataset.cat = STATIONS[i].category;
    div.style.left = p1.x + "px"; div.style.top = p1.y + "px";
    div.style.width = (p2.x - p1.x - 1) + "px"; div.style.height = (p2.y - p1.y - 1) + "px";
    div.style.background = CATEGORIES[STATIONS[i].category].css;
    minimapMap.appendChild(div);
  }
  // operator strip + server (gray blocks)
  const op1 = sx(FP.origin.x + LAYOUT.margin, FP.origin.z + LAYOUT.margin);
  const op2 = sx(FP.origin.x + LAYOUT.margin + FP.sideStrip - 0.5, FP.origin.z + LAYOUT.margin + FP.gridD * 0.55);
  const opDiv = document.createElement("div");
  opDiv.className = "zone"; opDiv.style.background = "#3a4252";
  opDiv.style.left = op1.x + "px"; opDiv.style.top = op1.y + "px";
  opDiv.style.width = (op2.x - op1.x) + "px"; opDiv.style.height = (op2.y - op1.y) + "px";
  minimapMap.appendChild(opDiv);

  const sv1 = sx(FP.origin.x + LAYOUT.margin, FP.origin.z + FP.totalD - LAYOUT.margin - FP.gridD * 0.30);
  const sv2 = sx(FP.origin.x + LAYOUT.margin + FP.sideStrip - 0.5, FP.origin.z + FP.totalD - LAYOUT.margin - FP.gridD * 0.05);
  const svDiv = document.createElement("div");
  svDiv.className = "zone"; svDiv.style.background = "#1f2a3a";
  svDiv.style.left = sv1.x + "px"; svDiv.style.top = sv1.y + "px";
  svDiv.style.width = (sv2.x - sv1.x) + "px"; svDiv.style.height = (sv2.y - sv1.y) + "px";
  minimapMap.appendChild(svDiv);

  const vp = document.createElement("div");
  vp.className = "viewport";
  minimapMap.appendChild(vp);
  return vp;
}
const minimapViewport = buildMinimap();
function updateMinimap() {
  const w = minimapMap.clientWidth, h = minimapMap.clientHeight;
  const t = controls.target;
  const radius = camera.position.distanceTo(t) * 0.5;
  const px = ((t.x - FP.origin.x) / FP.totalW) * w;
  const py = ((t.z - FP.origin.z) / FP.totalD) * h;
  const vw = Math.min(w * 0.9, (radius / FP.totalW) * w * 0.8);
  const vh = Math.min(h * 0.9, (radius / FP.totalD) * h * 0.8);
  minimapViewport.style.left = (px - vw/2) + "px";
  minimapViewport.style.top = (py - vh/2) + "px";
  minimapViewport.style.width = vw + "px";
  minimapViewport.style.height = vh + "px";
}

// ---- Raycasting ---------------------------------------------------------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const allPickables = [];
for (const node of stationNodes) for (const p of node.root.userData.pickables) allPickables.push(p);

function pickAt(x, y) {
  ndc.x = (x / window.innerWidth) * 2 - 1;
  ndc.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(allPickables, false);
  if (!hits.length) return null;
  const obj = hits[0].object;
  return obj.userData.pickTarget?.userData?.idx ?? null;
}

let hoverIdx = -1;
let selectedIdx = -1;
let activeCats = new Set(Object.keys(CATEGORIES));
let searchTerm = "";

function setHover(i) {
  if (hoverIdx === i) return;
  if (hoverIdx >= 0) {
    const r = stationNodes[hoverIdx].ringMat;
    if (hoverIdx !== selectedIdx) r.opacity = 0;
  }
  hoverIdx = i;
  if (hoverIdx >= 0) {
    stationNodes[hoverIdx].ringMat.opacity = hoverIdx === selectedIdx ? 0.6 : 0.30;
    sceneEl.classList.add("hovering");
  } else {
    sceneEl.classList.remove("hovering");
  }
}

renderer.domElement.addEventListener("mousemove", (e) => {
  const idx = pickAt(e.clientX, e.clientY);
  if (idx != null && activeCats.has(STATIONS[idx].category)) {
    setHover(idx);
  } else {
    setHover(-1);
  }
});

renderer.domElement.addEventListener("click", (e) => {
  if (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) > 4) return;
  const idx = pickAt(e.clientX, e.clientY);
  if (idx != null && activeCats.has(STATIONS[idx].category)) selectStation(idx);
});

// ---- Camera tween --------------------------------------------------------
let tween = null;
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }

function flyTo(pos, tgt, dur = 1200) {
  tween = {
    t: 0, dur,
    fromPos: camera.position.clone(),
    fromTgt: controls.target.clone(),
    toPos: pos.clone(),
    toTgt: tgt.clone(),
  };
}

// ---- Detail-mode visibility: hide perimeter walls + gantries of OTHER stations
// so the selected station interior is fully exposed (architectural cutaway)
let detailMode = false;
function setDetailMode(on, focusIdx = -1) {
  detailMode = on;
  labelsEl.classList.toggle("detail-mode", on);
  // hide perimeter walls + outdoor planters/trees? keep trees, hide walls
  shell.traverse(o => {
    if (!o.isMesh) return;
    // hide white walls (wallWhite material) and trim
    if (o.material === MATS.wallWhite || o.material === MATS.wallTrim) {
      o.visible = !on;
    }
  });
  // hide other stations' gantries so the view is unobstructed
  for (let i = 0; i < stationNodes.length; i++) {
    const gan = stationNodes[i].gantry;
    if (!gan) continue;
    if (on && i !== focusIdx) {
      gan.visible = false;
    } else {
      gan.visible = true;
    }
  }
  applyDetailShading(on, focusIdx);
}

function selectStation(idx) {
  if (selectedIdx >= 0) {
    stationNodes[selectedIdx].ringMat.opacity = 0;
    tags[selectedIdx].el.classList.remove("selected");
  }
  selectedIdx = idx;
  const s = STATIONS[idx];
  const c = stationCenter(idx);
  tags[idx].el.classList.add("selected");
  stationNodes[idx].ringMat.opacity = 0.55;
  // dollhouse cutaway: roof-off close view, slightly tilted
  const dist = 7.5;
  const angle = -Math.PI / 4 + Math.PI; // come from front-right of station
  const elev = Math.PI / 4.5;
  const pos = new THREE.Vector3(
    c.x + Math.cos(angle) * dist,
    Math.sin(elev) * dist + 2.0,
    c.z + Math.sin(angle) * dist + 4.0
  );
  const tgt = new THREE.Vector3(c.x, 1.0, c.z);
  flyTo(pos, tgt, 1200);
  setDetailMode(true, idx);
  openPanel(s);
  hideHint();
}

function clearSelection() {
  if (selectedIdx >= 0) {
    stationNodes[selectedIdx].ringMat.opacity = 0;
    tags[selectedIdx].el.classList.remove("selected");
    selectedIdx = -1;
  }
  closePanel();
  setDetailMode(false);
}

function flyOverview() {
  clearSelection();
  flyTo(OVERVIEW.pos, OVERVIEW.tgt, 1300);
}

function flyFloorplan() {
  clearSelection();
  const pos = new THREE.Vector3(0, Math.max(FP.totalW, FP.totalD) * 1.05, 0.001);
  flyTo(pos, new THREE.Vector3(0, 0, 0), 1000);
}

// ---- Info panel ----------------------------------------------------------
function openPanel(s) {
  panelEl.classList.add("open");
  const cat = CATEGORIES[s.category];
  const preview = panelEl.querySelector(".preview");
  preview.style.color = cat.css;
  panelEl.querySelector(".id").textContent = `STATION ${s.code}  ·  USE CASE ${String(s.useCase).padStart(2,"0")}`;
  const catEl = panelEl.querySelector(".cat");
  catEl.textContent = cat.label;
  catEl.style.background = cat.css;
  panelEl.querySelector(".name").textContent = s.name;
  panelEl.querySelector(".desc").textContent = s.objective;
  const robotType = s.robot === "TII Legged" ? "TII Legged robot" : `${s.robot} humanoid`;
  panelEl.querySelector("#kv-robot").innerHTML  = `<b>${robotType}</b>`;
  panelEl.querySelector("#kv-count").textContent = `1 operator · ${s.robot} robot · ${s.code}`;
  panelEl.querySelector("#kv-area").textContent  = `${s.area} m²`;
  panelEl.querySelector("#kv-status").innerHTML  = `<span class="dot"></span> Live · overhead RGB-D + data terminal`;

  // equipment
  const eq = panelEl.querySelector("#chips-eq"); eq.innerHTML = "";
  for (const e of s.equipment) {
    const c = document.createElement("span"); c.className = "chip"; c.textContent = e;
    eq.appendChild(c);
  }
  // sensors
  const sn = panelEl.querySelector("#chips-sn"); sn.innerHTML = "";
  for (const e of s.sensors) {
    const c = document.createElement("span"); c.className = "chip"; c.textContent = e;
    sn.appendChild(c);
  }
  // demo metrics
  const seed = s.id;
  const eps = 120 + (seed * 37) % 380;
  const hrs = 200 + (seed * 53) % 1400;
  const acc = 12 + (seed * 3) % 8;
  panelEl.querySelector("#m-ep").textContent  = eps.toLocaleString();
  panelEl.querySelector("#m-hr").textContent  = hrs.toLocaleString();
  panelEl.querySelector("#m-ac").textContent  = acc + "%";
}
function closePanel() { panelEl.classList.remove("open"); }
panelEl.querySelector(".close").addEventListener("click", () => { clearSelection(); flyOverview(); });

// ---- Legend, filters, controls ------------------------------------------
function refreshTagsVisibility() {
  for (const t of tags) {
    const matchCat = activeCats.has(t.category);
    const matchSearch = !searchTerm ||
      t.station.name.toLowerCase().includes(searchTerm) ||
      t.station.code.toLowerCase().includes(searchTerm);
    if (matchCat && matchSearch) t.el.classList.remove("hidden", "dimmed");
    else if (matchCat) { t.el.classList.add("dimmed"); t.el.classList.remove("hidden"); }
    else t.el.classList.add("hidden");
    if (!matchCat) stationNodes[t.idx].ringMat.opacity = 0;
  }
}

function setupLegend() {
  const legend = document.getElementById("legend-rows");
  legend.innerHTML = "";
  const order = ["standard","fb","home","logistics","security","mobility"];
  for (const id of order) {
    const cat = CATEGORIES[id];
    const count = STATIONS.filter(s => s.category === id).length;
    const useCases = new Set(STATIONS.filter(s => s.category === id).map(s => s.useCase)).size;
    const row = document.createElement("div");
    row.className = "row"; row.dataset.id = id;
    row.innerHTML = `
      <div class="left">
        <span class="swatch" style="background:${cat.css}"></span>
        <span class="label">${cat.label}</span>
      </div>
      <span class="count">${useCases} · ${count}</span>`;
    row.title = `${useCases} use cases · ${count} stations`;
    row.addEventListener("click", () => openStationPicker(id));
    legend.appendChild(row);
  }
}
setupLegend();

function closeStationPicker() {
  pickerEl.classList.add("hidden");
}

function openStationPicker(categoryId = "all") {
  const byCategory = categoryId !== "all";
  const cats = byCategory ? [categoryId] : ["standard","fb","home","logistics","security","mobility"];
  pickerTitleEl.textContent = byCategory ? CATEGORIES[categoryId].label : "All Stations";
  pickerListEl.innerHTML = "";

  for (const catId of cats) {
    const rows = STATIONS
      .map((station, idx) => ({ station, idx }))
      .filter(({ station }) => station.category === catId);
    if (!rows.length) continue;

    const cat = CATEGORIES[catId];
    if (!byCategory) {
      const head = document.createElement("div");
      head.className = "picker-cat";
      head.innerHTML = `<span class="swatch" style="background:${cat.css}"></span>${cat.label}`;
      pickerListEl.appendChild(head);
    }

    for (const { station, idx } of rows) {
      const row = document.createElement("button");
      row.className = "picker-row";
      row.type = "button";
      row.style.setProperty("--row-color", cat.css);
      row.innerHTML = `
        <span class="code">${station.code}</span>
        <span class="name">${station.name}</span>
        <span class="robot">${station.robot}</span>`;
      row.addEventListener("click", () => {
        closeStationPicker();
        selectStation(idx);
      });
      pickerListEl.appendChild(row);
    }
  }

  pickerEl.classList.remove("hidden");
}

pickerEl.querySelector(".picker-close").addEventListener("click", closeStationPicker);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeStationPicker();
});

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  refreshTagsVisibility();
});

document.getElementById("btn-3d").addEventListener("click", () => { setActiveBtn("btn-3d"); flyOverview(); });
document.getElementById("btn-fp").addEventListener("click", () => { setActiveBtn("btn-fp"); flyFloorplan(); });
document.getElementById("btn-back").addEventListener("click", flyOverview);
function setActiveBtn(id) {
  for (const b of ["btn-3d","btn-fp"]) document.getElementById(b).classList.toggle("active", b === id);
}

for (const b of document.querySelectorAll(".topbar nav button")) {
  b.addEventListener("click", () => {
    document.querySelectorAll(".topbar nav button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    const v = b.dataset.view;
    if (v === "overview") flyOverview();
    else if (v === "plan") flyFloorplan();
    else if (v === "stations") openStationPicker("all");
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { clearSelection(); flyOverview(); }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Project 3D → screen for labels -------------------------------------
const _v = new THREE.Vector3();
function projectLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const t of tags) {
    if (t.el.classList.contains("hidden")) continue;
    _v.copy(t.world).project(camera);
    if (_v.z > 1) { t.el.style.display = "none"; continue; }
    t.el.style.display = "";
    const sx = (_v.x * 0.5 + 0.5) * w;
    const sy = (-_v.y * 0.5 + 0.5) * h;
    t.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`;
  }
  for (const z of zoneLabels) {
    _v.copy(z.world).project(camera);
    if (_v.z > 1) { z.el.style.display = "none"; continue; }
    z.el.style.display = "";
    const sx = (_v.x * 0.5 + 0.5) * w;
    const sy = (-_v.y * 0.5 + 0.5) * h;
    z.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%)`;
  }
}

// idle bob for robots
const robotGroups = [];
world.traverse(o => { if (o.userData?.kind === "robot") robotGroups.push(o); });
const robotPhase = robotGroups.map(() => Math.random() * Math.PI * 2);
const robotBaseY = robotGroups.map(g => g.position.y);

let hintHidden = false;
function hideHint() { if (hintHidden) return; hintHidden = true; hintEl.classList.add("hidden"); }
setTimeout(hideHint, 9000);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (tween) {
    tween.t += dt * 1000;
    let p = Math.min(tween.t / tween.dur, 1);
    const e = easeInOutCubic(p);
    camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
    controls.target.lerpVectors(tween.fromTgt, tween.toTgt, e);
    if (p >= 1) tween = null;
  }
  controls.update();
  if (selectedIdx >= 0) {
    const r = stationNodes[selectedIdx].ringMat;
    r.opacity = 0.42 + Math.sin(t * 3.4) * 0.18;
  }
  for (let i = 0; i < robotGroups.length; i++) {
    // use new pose-aware idle animation (breathing + head sway)
    animateRobotIdle(robotGroups[i], t, robotPhase[i]);
  }
  renderer.render(scene, camera);
  projectLabels();
  updateMinimap();
}
animate();

requestAnimationFrame(() => { setTimeout(() => loaderEl.classList.add("hidden"), 400); });
