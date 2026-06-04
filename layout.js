// ============================================================
// ORIGEN Facility — Layout engine (2 floors + service core)
//
// Each floor = a left SERVICE CORE strip (washrooms · pantry · service · lift/stair lobby)
// + a right OPERATIONS BLOCK = stations (packed, top) over a SUPPORT BAND (bottom).
//   Support band anchors enclosed/utility areas to corners and keeps the
//   Annotation & Support desks as a big OPEN zone (no partitions).
//     Floor 1: [ Consumables & Spares | open Annotation & Support desks ]
//     Floor 2: [ Office | open Annotation & Support desks | Server Room ]
// ============================================================

import { STATIONS, CATEGORIES, CATEGORY_ORDER } from "./stations.js";

export const FLOOR_H = 3.9;
export const WALL_H  = 3.3;
const AISLE    = 1.7;
const PAD      = 2.2;
const TARGET_W = 24;
const CORE_W   = 7.2;
const CORE_GAP = 1.4;
const WALL_T   = 0.24;
const BAND_GAP = 2.2;   // gap between station rows and the support band

export function cellSize(area) { return { w: Math.sqrt(area * 1.18), d: Math.sqrt(area / 1.18) }; }

// ---- station-only packing (banded shelf-pack, centered at 0,0) ----------
function floorStations(floor) {
  return STATIONS.filter((s) => s.floor === floor)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
    .map((s) => { const c = cellSize(s.area); return { id: s.id, w: c.w, d: c.d, band: s.category }; });
}
function pack(cells, targetW) {
  const rows = [];
  let row = [], rowW = 0, prevBand = null;
  const flush = () => { if (row.length) { rows.push(row); row = []; rowW = 0; } };
  for (const c of cells) {
    if (prevBand !== null && c.band !== prevBand) flush();
    else if (rowW > 0 && rowW + c.w > targetW) flush();
    row.push(c); rowW += c.w + AISLE; prevBand = c.band;
  }
  flush();
  const place = new Map();
  let z = 0, maxW = 0;
  for (const r of rows) {
    const rw = r.reduce((a, c) => a + c.w, 0) + AISLE * (r.length - 1);
    const rd = Math.max(...r.map((c) => c.d));
    maxW = Math.max(maxW, rw);
    let x = -rw / 2;
    for (const c of r) { place.set(c.id, { x: x + c.w / 2, z: z + rd / 2, w: c.w, d: c.d }); x += c.w + AISLE; }
    z += rd + AISLE;
  }
  const depth = z - AISLE;
  for (const v of place.values()) v.z -= depth / 2;
  return { place, width: maxW, depth };
}

// ---- support band footprints --------------------------------------------
const SUPPORT = {
  1: { spares: { key: "spares", label: "Consumables & Spare Parts", w: 8.4, d: 6.0 },
       anno:   { key: "support1", label: "Annotation & Support · 5 Desks", d: 4.8 } },
  2: { office: { key: "office", label: "Office Space", w: 5.2, d: 4.6 },
       server: { key: "server", label: "Server Room", w: 6.2, d: 5.2 },
       anno:   { key: "support2", label: "Annotation & Support · 5 Desks", d: 4.8 } },
};
const MIN_ANNO = 8.0;

const PS = { 1: pack(floorStations(1), TARGET_W), 2: pack(floorStations(2), TARGET_W) };

// required band widths
const reqBand1 = SUPPORT[1].spares.w + BAND_GAP + MIN_ANNO;
const reqBand2 = SUPPORT[2].office.w + SUPPORT[2].server.w + 2 * BAND_GAP + MIN_ANNO;
const mainW = Math.max(PS[1].width, PS[2].width, reqBand1, reqBand2);

const bandD = { 1: Math.max(SUPPORT[1].spares.d, SUPPORT[1].anno.d) + 1.0,
                2: Math.max(SUPPORT[2].server.d, SUPPORT[2].anno.d) + 1.0 };
const opsD = { 1: PS[1].depth + BAND_GAP + bandD[1], 2: PS[2].depth + BAND_GAP + bandD[2] };
const maxOpsD = Math.max(opsD[1], opsD[2]);

const INTERIOR_W = PAD + CORE_W + CORE_GAP + mainW + PAD;
const INTERIOR_D = PAD + maxOpsD + PAD;
const ORIGIN_X = -INTERIOR_W / 2;
const CORE_CX = ORIGIN_X + PAD + CORE_W / 2;
const MAIN_LEFT = ORIGIN_X + PAD + CORE_W + CORE_GAP;
const MAIN_CX = MAIN_LEFT + mainW / 2;
const DIVIDER_X = ORIGIN_X + PAD + CORE_W + CORE_GAP / 2;

// per-floor vertical placement of stations (top) + band (bottom)
const stationShift = { 1: -opsD[1] / 2 + PS[1].depth / 2, 2: -opsD[2] / 2 + PS[2].depth / 2 };
const bandCz = { 1: opsD[1] / 2 - bandD[1] / 2, 2: opsD[2] / 2 - bandD[2] / 2 };

export const BUILDING = {
  interiorW: INTERIOR_W, interiorD: INTERIOR_D,
  totalW: INTERIOR_W + WALL_T * 2, totalD: INTERIOR_D + WALL_T * 2,
  wallT: WALL_T, wallH: WALL_H, floorH: FLOOR_H,
  coreCx: CORE_CX, coreW: CORE_W, dividerX: DIVIDER_X, mainCx: MAIN_CX, mainW,
};

// station id → world XZ
const STATION_PLACE = new Map();
for (const fl of [1, 2]) for (const [id, v] of PS[fl].place) {
  STATION_PLACE.set(id, { x: v.x + MAIN_CX, z: v.z + stationShift[fl], w: v.w, d: v.d });
}
export function stationPlacement(id) { return STATION_PLACE.get(id); }

// support areas — corners + open desks
export function getSupportPlacement(floor) {
  const cz = bandCz[floor];
  const out = [];
  if (floor === 1) {
    const sp = SUPPORT[1].spares, an = SUPPORT[1].anno;
    out.push({ ...sp, cx: MAIN_CX - mainW / 2 + sp.w / 2, cz, enclosed: false });
    const left = -mainW / 2 + sp.w + BAND_GAP, annoW = mainW - sp.w - BAND_GAP;
    out.push({ ...an, w: annoW, cx: MAIN_CX + left + annoW / 2, cz, open: true });
  } else {
    const of = SUPPORT[2].office, sv = SUPPORT[2].server, an = SUPPORT[2].anno;
    out.push({ ...of, cx: MAIN_CX - mainW / 2 + of.w / 2, cz, open: true });
    out.push({ ...sv, cx: MAIN_CX + mainW / 2 - sv.w / 2, cz, enclosed: true });
    const annoW = mainW - of.w - sv.w - 2 * BAND_GAP;
    out.push({ ...an, w: annoW, cx: MAIN_CX, cz, open: true });
  }
  return out;
}

// service-core rooms (same on each floor)
const CORE_DEFS = [
  { key: "washrooms", label: "Washrooms",          frac: 0.24 },
  { key: "service",   label: "Store · Elec · Tel",  frac: 0.18 },
  { key: "pantry",    label: "Pantry",             frac: 0.26 },
  { key: "lift",      label: "Lift & Stair Lobby", frac: 0.32 },
];
export function getCoreRooms() {
  const coreD = INTERIOR_D - PAD * 2;
  let z = -coreD / 2;
  const out = [];
  for (const r of CORE_DEFS) { const d = coreD * r.frac; out.push({ key: r.key, label: r.label, cx: CORE_CX, cz: z + d / 2, w: CORE_W, d }); z += d; }
  return out;
}

// category cluster centers for floating labels
export function getStationZoneLabels(floor) {
  const byCat = {};
  for (const s of STATIONS.filter((x) => x.floor === floor)) {
    const p = STATION_PLACE.get(s.id);
    const b = (byCat[s.category] ||= { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
    b.minX = Math.min(b.minX, p.x - p.w / 2); b.maxX = Math.max(b.maxX, p.x + p.w / 2);
    b.minZ = Math.min(b.minZ, p.z - p.d / 2); b.maxZ = Math.max(b.maxZ, p.z + p.d / 2);
  }
  return Object.keys(byCat).map((c) => { const b = byCat[c]; return { id: c, label: CATEGORIES[c].label.toUpperCase(), x: (b.minX + b.maxX) / 2, y: 0.05, z: b.minZ - 0.7 }; });
}
