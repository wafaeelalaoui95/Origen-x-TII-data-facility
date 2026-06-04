// ============================================================
// ORIGEN x TII Data Collection Facility — Station program
// 18 stations across 5 scenarios, split over a 2-floor building.
//
// Robot allocation:
//   - TII Bipedal: 0
//   - A2 (Agibot, bipedal): every scenario except logistics
//   - G2 (Agibot, wheeled): logistics only
// Locomotion stations run 2 robots each (1:1 operator:robot → 2 operators).
//
// Floor split (≈ half the robots on each floor):
//   FLOOR 1 — Industrial : Logistics · Security · Locomotion  (9 stations, 12 robots)
//             + Annotation & Support desks · Consumables & Spare Parts
//   FLOOR 2 — Domestic   : F&B · Home                         (9 stations, 9 robots)
//             + Annotation & Support desks · Server Room · Office
//   Washrooms + Pantry live in a SERVICE CORE on each floor (outside the work area).
// ============================================================

export const CATEGORIES = {
  fb:         { id: "fb",         label: "F & B",       color: 0xef8a3a, css: "#ef8a3a", floor: 0xefeae3 },
  home:       { id: "home",       label: "Home",        color: 0x3aa56a, css: "#3aa56a", floor: 0xeaecea },
  logistics:  { id: "logistics",  label: "Logistics",   color: 0x8b5cf6, css: "#8b5cf6", floor: 0xe7e6ec },
  security:   { id: "security",   label: "Security",    color: 0xe0483b, css: "#e0483b", floor: 0xece8e6 },
  locomotion: { id: "locomotion", label: "Locomotion",  color: 0xd4b13a, css: "#d4b13a", floor: 0xece9df },
};

// id, code, name, category, kind, robot, area, difficulty, floor, objective, equipment, robots(=1)
const S = (id, code, name, category, kind, robot, area, difficulty, floor, objective, equipment, robots = 1) => ({
  id, code, name, category, kind, robot, area, difficulty, floor, objective, equipment,
  robots, operators: robots,
  sensors: ["Overhead RGB-D", "Robot wrist F/T", "Joint encoders", "Stereo head cams"],
});

export const STATIONS = [
  // ───── F & B — A2 (floor 2) ─────
  S(1, "F1", "Frying", "fb", "fb-fry", "A2", 12, "Medium", 2,
    "Pan control, flipping and plate transfer over an induction hob.",
    ["Kitchen counter","Induction hob prop","Pan","Spatula","Fake food items","Oil / sauce bottles","Extraction hood"]),
  S(2, "F2", "Pizza — Sauce + Toppings", "fb", "fb-pizza", "A2", 12, "Medium", 2,
    "Sauce spreading, topping placement and oven transfer.",
    ["Pizza prep counter","Dough base","Sauce bowl","Spoon / spreader","Topping trays","Cheese / vegetable props","Small oven prop"]),
  S(3, "F3", "Sandwich Assembly", "fb", "fb-sandwich", "A2", 12, "Medium", 2,
    "Layer ordering, dressing, wrap and tray.",
    ["Sandwich prep counter","Bread slices","Lettuce / tomato / cheese props","Condiment bottles","Tray","Packaging paper"]),

  // ───── HOME — A2 (floor 2) ─────
  S(4, "H1", "Countertop + Faucet + Buttons", "home", "home-counter", "A2", 16, "Medium", 2,
    "Faucet operation, button presses, cup handling, soap dispense.",
    ["Kitchen countertop","Sink","Faucet","Tap handles","Push buttons","Soap dispenser","Cups","Sponge","Small appliance props"]),
  S(5, "H2", "Dishwasher Rack", "home", "home-dishrack", "A2", 16, "Medium", 2,
    "Loading the pull-out rack with mixed plates, cups and utensils.",
    ["Dishwasher mockup","Pull-out rack","Plates","Cups","Utensils","Rack slots"]),
  S(6, "H3", "Drawers + Cabinet Resistance", "home", "home-drawers", "A2", 16, "Medium", 2,
    "Variable-resistance drawer operation and stored-object retrieval.",
    ["Kitchen cabinet module","Drawers with variable resistance","Cabinet handles","Stored objects","Internal shelves"]),
  S(7, "H4", "Laundry Drum Handling", "home", "home-drum", "A2", 16, "Medium", 2,
    "Circular drum door access; load and unload clothes.",
    ["Washing machine mockup","Circular drum door","Clothes","Detergent bottle","Laundry basket"]),
  S(8, "H5", "Making the Bed", "home", "home-bed", "A2", 25, "Medium", 2,
    "Sheet, blanket and pillow arrangement on a real bed frame.",
    ["Realistic bed frame","Mattress","Fitted sheet","Blanket","Pillows","Bedside table","Lamp","Linen basket"]),
  S(9, "H6", "Mopping the Floor", "home", "home-mop", "A2", 16, "Medium", 2,
    "Floor coverage with mop and bucket across a marked soiled zone.",
    ["Mop","Bucket","Wringer","Marked floor zones","Spill props","Caution sign"]),

  // ───── LOGISTICS — G2 wheeled (floor 1) ─────
  S(10, "L1", "Conveyor Pick & Place", "logistics", "log-conveyor", "G2", 20, "Medium", 1,
    "Continuous belt induction with scan, classify and divert.",
    ["Conveyor belt","Totes","Parcels","Sorting bins","Barcode scanner","Sensor arch"]),
  S(11, "L2", "Shelving Retrieval — A", "logistics", "log-shelf", "G2", 16, "Medium", 1,
    "Multi-level shelf pick from low, mid and high bays with pick lights.",
    ["Multi-level shelves","Bins","Boxes","Inventory labels","Pick lights","Floor markers"]),
  S(12, "L3", "Shelving Retrieval — B", "logistics", "log-shelf", "G2", 16, "Medium", 1,
    "Mirror cell for paired-station data parity.",
    ["Multi-level shelves","Bins","Boxes","Inventory labels","Pick lights","Floor markers"]),

  // ───── SECURITY — A2 (floor 1) ─────
  S(13, "S1", "Door Handles — Lever + Knob", "security", "sec-handle", "A2", 24, "Medium", 1,
    "Lever, knob, hinge and latch interactions across a panel row.",
    ["Multiple door panels","Lever handles","Round knobs","Hinges","Latch mechanisms","Lockset mockups"]),
  S(14, "S2", "Heavy Push / Pull Panel — A", "security", "sec-heavy", "A2", 20, "Medium", 1,
    "Industrial-weighted panel operation with safety markings.",
    ["Weighted industrial door / panel","Industrial handle","Resistance slider","Force gauge","Safety floor markings"]),
  S(15, "S3", "Heavy Push / Pull Panel — B", "security", "sec-heavy", "A2", 20, "Medium", 1,
    "Mirror cell for paired-station data parity.",
    ["Weighted industrial door / panel","Industrial handle","Resistance slider","Force gauge","Safety floor markings"]),

  // ───── LOCOMOTION — A2, 2 robots + 2 operators each, 30 m² (floor 1) ─────
  S(16, "M1", "Door Opening / Closing — Variable Resistance", "locomotion", "loco-door", "A2", 30, "Difficult", 1,
    "Two coordinated bipeds opening and closing doors of varying resistance.",
    ["Door frames","Lever + bar handles","Resistance modules","Force gauge","Floor markers","Self-closer mechanism"], 2),
  S(17, "M2", "Multi-height Manipulation — Floor ↔ High Shelf", "locomotion", "mob-multi", "A2", 30, "Difficult", 1,
    "Continuous reach from floor pick to mid table to high shelf place, two robots.",
    ["Floor objects","Mid-height table","High shelf","Boxes","Bins","Reach markers"], 2),
  S(18, "M3", "Large Object — Bimanual Handling", "locomotion", "mob-bimanual", "A2", 30, "Difficult", 1,
    "Two-handed carry of a wide tray / furniture-like object through an obstacle lane.",
    ["Large box","Wide tray","Furniture-like object","Two-hand grasp markers","Obstacle lane"], 2),
];

export const CATEGORY_ORDER = ["fb", "home", "logistics", "security", "locomotion"];

export const FLOOR_LABELS = {
  1: "Logistics · Security · Locomotion",
  2: "F&B · Home",
};

// ---- Facility area breakdown (m²) ----
export const FACILITY = {
  totalSqm: 771,
  breakdown: [
    { key: "data",        label: "Data collection",        sqm: 416.4 },
    { key: "annotation",  label: "Annotation area",        sqm: 25 },
    { key: "server",      label: "Server area",            sqm: 30 },
    { key: "pantry",      label: "Pantry",                 sqm: 35 },
    { key: "washrooms",   label: "Washrooms",              sqm: 50 },
    { key: "spares",      label: "Consumables & spares",   sqm: 50 },
    { key: "office",      label: "Office space",           sqm: 20 },
    { key: "passage",     label: "Passageway",             sqm: 50 },
    { key: "buffer",      label: "Buffer & passageway",    sqm: 94.28 },
  ],
};
