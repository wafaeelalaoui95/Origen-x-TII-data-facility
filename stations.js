// ============================================================
// ORIGEN Robotics Data Collection Facility — Station program
// 27 use cases, 48 stations total.
// Robot allocation:
//   - G2 humanoid: LOGISTICS use cases only (19, 20, 21) → 5 stations
//   - A2 humanoid: every other use case (Standard, F&B, Home, Security, Mobility)
// Layout: 8-column grid, stations packed row-major.
// Cell size: 4.5m × 3.6m (uniform); panel shows the spec sqm.
// ============================================================

export const CATEGORIES = {
  standard:  { id: "standard",  label: "Standard Training", color: 0x2f6dff, css: "#2f6dff", floor: 0xe3e5e8 },
  fb:        { id: "fb",        label: "F & B",             color: 0xef8a3a, css: "#ef8a3a", floor: 0xefeae3 },
  home:      { id: "home",      label: "Home",              color: 0x3aa56a, css: "#3aa56a", floor: 0xeaecea },
  logistics: { id: "logistics", label: "Logistics",         color: 0x8b5cf6, css: "#8b5cf6", floor: 0xe7e6ec },
  security:  { id: "security",  label: "Security",          color: 0xe0483b, css: "#e0483b", floor: 0xece8e6 },
  mobility:  { id: "mobility",  label: "Mobility",          color: 0xd4b13a, css: "#d4b13a", floor: 0xece9df },
};

// helper
const S = (id, useCase, code, name, category, kind, robot, area, objective, equipment) => ({
  id, useCase, code, name, category, kind, robot, area, objective, equipment,
  sensors: ["Overhead RGB-D", "Robot wrist F/T", "Joint encoders", "Stereo head cams"],
});

export const STATIONS = [
  // ───── STANDARD TRAINING (use cases 1–7, 13 stations) — A2 ─────
  S( 1, 1, "1A", "Pick & Place — A", "standard", "std-pick", "A2", 12,
     "Bimanual pick-and-place across rigid, deformable and reflective SKUs onto QR-coded target zones.",
     ["Stainless workbench","Object trays","Sorting bins","Cubes / cylinders / small boxes","QR-coded objects","Placement target mat"]),
  S( 2, 1, "1B", "Pick & Place — B", "standard", "std-pick", "A2", 12,
     "Mirror cell for paired-station data parity.",
     ["Stainless workbench","Object trays","Sorting bins","Cubes / cylinders / small boxes","QR-coded objects","Placement target mat"]),

  S( 3, 2, "2A", "Insert / Remove — A", "standard", "std-insert", "A2", 12,
     "Peg insertion, cable plug seating, cartridge removal with tolerance fixtures.",
     ["Peg board","Connector panel","Cable plug set","Removable cartridges","Tolerance fixture","Small parts tray"]),
  S( 4, 2, "2B", "Insert / Remove — B", "standard", "std-insert", "A2", 12,
     "Mirror cell.",
     ["Peg board","Connector panel","Cable plug set","Removable cartridges","Tolerance fixture","Small parts tray"]),

  S( 5, 3, "3A", "Close / Open — A", "standard", "std-closeopen", "A2", 12,
     "Hinged lids, sliding panels, latches and handles across articulation styles.",
     ["Small cabinet door","Hinged boxes","Sliding panels","Latch mechanisms","Handles","Lid mechanisms"]),
  S( 6, 3, "3B", "Close / Open — B", "standard", "std-closeopen", "A2", 12,
     "Mirror cell.",
     ["Small cabinet door","Hinged boxes","Sliding panels","Latch mechanisms","Handles","Lid mechanisms"]),

  S( 7, 4, "4A", "Turn / Twist — A", "standard", "std-turn", "A2", 12,
     "Knobs, valves, screw caps, rotary switches at calibrated torques.",
     ["Knob array","Valve set","Screw cap jars","Rotary switches","Bottle caps","Torque dial panel"]),
  S( 8, 4, "4B", "Turn / Twist — B", "standard", "std-turn", "A2", 12,
     "Mirror cell.",
     ["Knob array","Valve set","Screw cap jars","Rotary switches","Bottle caps","Torque dial panel"]),

  S( 9, 5, "5A", "Push / Pull — A", "standard", "std-pushpull", "A2", 12,
     "Sliding drawers, push plates, spring-loaded panels with force feedback.",
     ["Sliding drawer","Push plate","Pull handle","Spring-resistance module","Weighted panel","Force gauge display"]),
  S(10, 5, "5B", "Push / Pull — B", "standard", "std-pushpull", "A2", 12,
     "Mirror cell.",
     ["Sliding drawer","Push plate","Pull handle","Spring-resistance module","Weighted panel","Force gauge display"]),

  S(11, 6, "6A", "Lift / Lower — A", "standard", "std-lift", "A2", 12,
     "Weighted item transfer between low and mid-height shelves.",
     ["Low shelf","Mid-height shelf","Small weighted boxes","Foam parcels","Height markers","Object bins"]),
  S(12, 6, "6B", "Lift / Lower — B", "standard", "std-lift", "A2", 12,
     "Mirror cell.",
     ["Low shelf","Mid-height shelf","Small weighted boxes","Foam parcels","Height markers","Object bins"]),

  S(13, 7, "7",  "Wipe", "standard", "std-wipe", "A2", 12,
     "Surface coverage strategies, residue detection, cloth conditioning.",
     ["Counter surface","Glass panel","Cloths","Sponge","Spray bottle prop","Marked cleaning zones"]),

  // ───── F & B (use cases 8–10, 6 stations) — A2 ─────
  S(14, 8, "8A", "Frying — A", "fb", "fb-fry", "A2", 12,
     "Pan control, flipping, plate transfer over induction hob.",
     ["Kitchen counter","Induction hob prop","Pan","Spatula","Fake food items","Oil / sauce bottles","Extraction hood"]),
  S(15, 8, "8B", "Frying — B", "fb", "fb-fry", "A2", 12,
     "Mirror cell.",
     ["Kitchen counter","Induction hob prop","Pan","Spatula","Fake food items","Oil / sauce bottles","Extraction hood"]),

  S(16, 9, "9A", "Pizza Sauce + Toppings — A", "fb", "fb-pizza", "A2", 12,
     "Sauce spreading, topping placement, oven transfer.",
     ["Pizza prep counter","Dough base","Sauce bowl","Spoon / spreader","Topping trays","Cheese / vegetable props","Small oven prop"]),
  S(17, 9, "9B", "Pizza Sauce + Toppings — B", "fb", "fb-pizza", "A2", 12,
     "Mirror cell.",
     ["Pizza prep counter","Dough base","Sauce bowl","Spoon / spreader","Topping trays","Cheese / vegetable props","Small oven prop"]),

  S(18, 10, "10A", "Sandwich Assembly — A", "fb", "fb-sandwich", "A2", 12,
     "Layer ordering, dressing, wrap and tray.",
     ["Sandwich prep counter","Bread slices","Lettuce / tomato / cheese props","Condiment bottles","Tray","Packaging paper"]),
  S(19, 10, "10B", "Sandwich Assembly — B", "fb", "fb-sandwich", "A2", 12,
     "Mirror cell.",
     ["Sandwich prep counter","Bread slices","Lettuce / tomato / cheese props","Condiment bottles","Tray","Packaging paper"]),

  // ───── HOME (use cases 11–18, 16 stations) — A2 ─────
  S(20, 11, "11A", "Clothes Folding — A", "home", "home-fold", "A2", 12,
     "Garment-class folding into stacks with alignment grid.",
     ["Folding table","Shirts","Towels","Pants","Laundry basket","Alignment grid"]),
  S(21, 11, "11B", "Clothes Folding — B", "home", "home-fold", "A2", 12,
     "Mirror cell.",
     ["Folding table","Shirts","Towels","Pants","Laundry basket","Alignment grid"]),

  S(22, 12, "12A", "Countertop + Faucet + Buttons — A", "home", "home-counter", "A2", 16,
     "Faucet operation, button presses, cup handling, soap dispense.",
     ["Kitchen countertop","Sink","Faucet","Tap handles","Push buttons","Soap dispenser","Cups","Sponge","Small appliance props"]),
  S(23, 12, "12B", "Countertop + Faucet + Buttons — B", "home", "home-counter", "A2", 16,
     "Mirror cell.",
     ["Kitchen countertop","Sink","Faucet","Tap handles","Push buttons","Soap dispenser","Cups","Sponge","Small appliance props"]),

  S(24, 13, "13A", "Dishwasher Rack — A", "home", "home-dishrack", "A2", 16,
     "Loading the pull-out rack with mixed plates, cups, utensils.",
     ["Dishwasher mockup","Pull-out rack","Plates","Cups","Utensils","Rack slots"]),
  S(25, 13, "13B", "Dishwasher Rack — B", "home", "home-dishrack", "A2", 16,
     "Mirror cell.",
     ["Dishwasher mockup","Pull-out rack","Plates","Cups","Utensils","Rack slots"]),

  S(26, 14, "14A", "Drawers + Cabinet Resistance — A", "home", "home-drawers", "A2", 16,
     "Variable-resistance drawer operation; stored-object retrieval.",
     ["Kitchen cabinet module","Drawers with variable resistance","Cabinet handles","Stored objects","Internal shelves"]),
  S(27, 14, "14B", "Drawers + Cabinet Resistance — B", "home", "home-drawers", "A2", 16,
     "Mirror cell.",
     ["Kitchen cabinet module","Drawers with variable resistance","Cabinet handles","Stored objects","Internal shelves"]),

  S(28, 15, "15A", "Fridge Door + Shelves — A", "home", "home-fridge", "A2", 16,
     "Fridge door pull, shelf navigation, bottle and box retrieval.",
     ["Fridge mockup","Fridge door shelves","Bottles","Boxes","Pull handle","Interior shelves"]),
  S(29, 15, "15B", "Fridge Door + Shelves — B", "home", "home-fridge", "A2", 16,
     "Mirror cell.",
     ["Fridge mockup","Fridge door shelves","Bottles","Boxes","Pull handle","Interior shelves"]),

  S(30, 16, "16A", "Laundry Drum Handling — A", "home", "home-drum", "A2", 16,
     "Circular drum door access; load and unload clothes.",
     ["Washing machine mockup","Circular drum door","Clothes","Detergent bottle","Laundry basket"]),
  S(31, 16, "16B", "Laundry Drum Handling — B", "home", "home-drum", "A2", 16,
     "Mirror cell.",
     ["Washing machine mockup","Circular drum door","Clothes","Detergent bottle","Laundry basket"]),

  S(32, 17, "17A", "Making the Bed — A", "home", "home-bed", "A2", 25,
     "Sheet, blanket and pillow arrangement on a real bed frame.",
     ["Realistic bed frame","Mattress","Fitted sheet","Blanket","Pillows","Bedside table","Lamp","Linen basket"]),
  S(33, 17, "17B", "Making the Bed — B", "home", "home-bed", "A2", 25,
     "Mirror cell.",
     ["Realistic bed frame","Mattress","Fitted sheet","Blanket","Pillows","Bedside table","Lamp","Linen basket"]),

  S(34, 18, "18A", "Washing the Dishes — A", "home", "home-washdish", "A2", 15,
     "Scrub, rinse, rack with sponge and soap dispenser.",
     ["Sink basin","Faucet","Dish rack","Plates","Cups","Sponge","Soap dispenser","Drying area"]),
  S(35, 18, "18B", "Washing the Dishes — B", "home", "home-washdish", "A2", 15,
     "Mirror cell.",
     ["Sink basin","Faucet","Dish rack","Plates","Cups","Sponge","Soap dispenser","Drying area"]),

  // ───── LOGISTICS (use cases 19–21, 5 stations) — G2 ─────
  S(36, 19, "19",  "Conveyor Pick & Place", "logistics", "log-conveyor", "G2", 20,
     "Continuous belt induction with scan, classify, divert.",
     ["Conveyor belt","Totes","Parcels","Sorting bins","Barcode scanner","Sensor arch"]),

  S(37, 20, "20A", "Packing + Small Conveyor — A", "logistics", "log-pack", "G2", 20,
     "Carton fold, void-fill, tape, label, scale.",
     ["Small conveyor","Packing table","Cardboard boxes","Tape dispenser","Label printer","Scale","Parcel bins"]),
  S(38, 20, "20B", "Packing + Small Conveyor — B", "logistics", "log-pack", "G2", 20,
     "Mirror cell.",
     ["Small conveyor","Packing table","Cardboard boxes","Tape dispenser","Label printer","Scale","Parcel bins"]),

  S(39, 21, "21A", "Shelving Retrieval (multi-height) — A", "logistics", "log-shelf", "G2", 16,
     "Multi-level shelf pick from low, mid and high bays with pick lights.",
     ["Multi-level shelves","Bins","Boxes","Inventory labels","Pick lights","Floor markers"]),
  S(40, 21, "21B", "Shelving Retrieval (multi-height) — B", "logistics", "log-shelf", "G2", 16,
     "Mirror cell.",
     ["Multi-level shelves","Bins","Boxes","Inventory labels","Pick lights","Floor markers"]),

  // ───── SECURITY (use cases 22–24, 5 stations) — A2 ─────
  S(41, 22, "22A", "Access Control — A", "security", "sec-access", "TII Legged", 16,
     "Card, key and button-based access drills with intercom.",
     ["Door frame","Keypad","Card reader","Key slot","Push button","Intercom","Access panel"]),
  S(42, 22, "22B", "Access Control — B", "security", "sec-access", "A2", 16,
     "Mirror cell.",
     ["Door frame","Keypad","Card reader","Key slot","Push button","Intercom","Access panel"]),

  S(43, 23, "23",  "Door Handles — Lever + Knob", "security", "sec-handle", "TII Legged", 24,
     "Lever, knob, hinge and latch interactions across a panel row.",
     ["Multiple door panels","Lever handles","Round knobs","Hinges","Latch mechanisms","Lockset mockups"]),

  S(44, 24, "24A", "Heavy Push / Pull Panel — A", "security", "sec-heavy", "TII Legged", 20,
     "Industrial-weighted panel operation with safety markings.",
     ["Weighted industrial door / panel","Industrial handle","Resistance slider","Force gauge","Safety floor markings"]),
  S(45, 24, "24B", "Heavy Push / Pull Panel — B", "security", "sec-heavy", "TII Legged", 20,
     "Mirror cell.",
     ["Weighted industrial door / panel","Industrial handle","Resistance slider","Force gauge","Safety floor markings"]),

  // ───── MOBILITY / LOCOMOTION (use cases 25–27, 3 stations) — A2 (locomotion) ─────
  S(46, 25, "25", "Steps + Threshold + Door", "mobility", "mob-steps", "TII Legged", 30,
     "Stair flight + threshold strip + ramp + door frame traversal.",
     ["Stairs","Low platform","Threshold strip","Door frame","Ramp","Handrail","Obstacle markers"]),

  S(47, 26, "26", "Multi-height Manipulation — Floor to High Shelf", "mobility", "mob-multi", "TII Legged", 30,
     "Continuous reach from floor pick to mid table to high shelf place.",
     ["Floor objects","Mid-height table","High shelf","Boxes","Bins","Reach markers"]),

  S(48, 27, "27", "Large Object — Bimanual Handling", "mobility", "mob-bimanual", "TII Legged", 30,
     "Two-handed carry of a wide tray / furniture-like object through an obstacle lane.",
     ["Large box","Wide tray","Furniture-like object","Two-hand grasp markers","Obstacle lane"]),
];

// ---- Layout grid ---------------------------------------------------------
// 8 columns × 6 rows = 48 cells, row-major fill.
// Stations are uniform cells; floor patch is tinted by category.
export const LAYOUT = {
  cols: 8, rows: 6,
  cell: { w: 4.5, d: 3.8 },
  gap: 0.55,           // small gap between cells (aisle feel)
  margin: 4.0,         // facility margin around the grid
  sideStrip: 7.5,      // operator + server room strip on the left
};
