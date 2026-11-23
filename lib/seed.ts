import type {
  ActivityLog,
  ApprovalRequest,
  HandoverNote,
  PurchaseOrder,
  StockCount,
  Supplier,
  Task,
  BacklogEntry,
  BrightProduct,
  ErpData,
  GroceryItem,
  RawCategory,
  RawExport,
  RawImport,
  Transaction,
} from "./types";
import { addDays, isoDate, today } from "./utils";

// seeded random so the demo data is the same every time
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeed(): ErpData {
  const r = mulberry32(42);
  const int = (a: number, b: number) => Math.floor(r() * (b - a + 1)) + a;
  const pick = <T>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const t0 = today();
  let n = 0;
  const id = (p: string) => `${p}${++n}`;

  // grocery
  const groceryDefs: [string, string, string, number, number][] = [
    ["Basmati Rice 5kg", "Staples", "bag", 520, 640],
    ["Whole Wheat Atta 10kg", "Staples", "bag", 380, 460],
    ["Toor Dal 1kg", "Staples", "pack", 135, 165],
    ["Sunflower Oil 1L", "Oils", "bottle", 140, 175],
    ["Mustard Oil 1L", "Oils", "bottle", 160, 195],
    ["Amul Butter 500g", "Dairy", "pack", 245, 285],
    ["Toned Milk 1L", "Dairy", "pack", 52, 62],
    ["Paneer 200g", "Dairy", "pack", 80, 99],
    ["Curd 400g", "Dairy", "cup", 38, 48],
    ["Brown Bread", "Bakery", "loaf", 38, 50],
    ["Rusk 300g", "Bakery", "pack", 45, 60],
    ["Marie Biscuits", "Snacks", "pack", 28, 35],
    ["Potato Chips 90g", "Snacks", "pack", 17, 20],
    ["Masala Noodles 4-pack", "Snacks", "pack", 48, 60],
    ["Tea Leaves 500g", "Beverages", "pack", 210, 260],
    ["Instant Coffee 100g", "Beverages", "jar", 290, 345],
    ["Orange Juice 1L", "Beverages", "carton", 95, 125],
    ["Sugar 1kg", "Staples", "pack", 42, 50],
    ["Iodised Salt 1kg", "Staples", "pack", 20, 28],
    ["Turmeric Powder 200g", "Spices", "pack", 52, 68],
    ["Red Chilli Powder 200g", "Spices", "pack", 60, 78],
    ["Garam Masala 100g", "Spices", "pack", 70, 92],
    ["Dish Wash Liquid 750ml", "Household", "bottle", 110, 140],
    ["Detergent Powder 1kg", "Household", "pack", 95, 125],
    ["Toothpaste 150g", "Personal Care", "tube", 78, 99],
    ["Bath Soap 4-pack", "Personal Care", "pack", 120, 155],
    ["Eggs (tray of 30)", "Dairy", "tray", 165, 199],
    ["Tomato Ketchup 1kg", "Sauces", "bottle", 115, 145],
  ];
  const suppliers = [
    "Metro Wholesale",
    "Sharma Traders",
    "FreshLink Distributors",
    "Gupta & Sons",
    "Om Agencies",
  ];
  const grocery: GroceryItem[] = groceryDefs.map(([name, category, unit, cost, sell], i) => {
    const perishable = ["Dairy", "Bakery", "Beverages"].includes(category);
    const expiryOffset = perishable ? int(-4, 25) : int(-10, 300);
    const reorderLevel = int(15, 40);
    const low = i % 6 === 2;
    return {
      id: id("g"),
      sku: `GR-${String(1001 + i)}`,
      name,
      category,
      supplier: pick(suppliers),
      storeQty: low ? int(0, 10) : int(40, 220),
      shelfQty: low ? int(0, 8) : int(10, 60),
      reorderLevel,
      unit,
      costPrice: cost,
      sellPrice: sell,
      expiryDate: isoDate(addDays(t0, expiryOffset)),
      addedOn: isoDate(addDays(t0, -int(10, 200))),
      barcode: `890${String(4000000000 + i * 7919)}`,
    };
  });

  const backlog: BacklogEntry[] = Array.from({ length: 9 }, (_, i) => {
    const item = grocery[(i * 5) % grocery.length];
    const created = addDays(t0, -int(1, 15));
    return {
      id: id("b"),
      itemId: item.id,
      task: pick([
        "Restock shelf",
        "Supplier order",
        "Price label update",
        "Return to supplier",
        "Quality check",
      ]),
      qty: int(10, 80),
      createdOn: isoDate(created),
      dueOn: isoDate(addDays(created, int(2, 12))),
      status: pick(["pending", "pending", "in-progress", "delayed", "done"] as const),
    };
  });

  const staff = ["Ravi Kumar", "Anita Singh", "Mohit Verma", "Admin"];
  const activity: ActivityLog[] = Array.from({ length: 30 }, (_, i): ActivityLog => {
    const item = pick(grocery);
    const kind = pick(["Stock received", "Moved to shelf", "Sold", "Adjustment", "Damaged write-off"]);
    const delta =
      kind === "Stock received"
        ? int(20, 120)
        : kind === "Adjustment"
          ? int(-60, 10)
          : -int(1, kind === "Damaged write-off" ? 40 : 25);
    const at = addDays(t0, -int(0, 20));
    const hour = i % 7 === 0 ? int(0, 4) : int(8, 21);
    at.setHours(hour, int(0, 59));
    const reasons: string[] = [];
    if (kind === "Adjustment" && delta < -25) reasons.push("Large negative adjustment");
    if (hour < 6) reasons.push("Activity outside working hours");
    if (kind === "Damaged write-off" && delta < -30) reasons.push("Unusually high write-off");
    return {
      id: id("a"),
      at: at.toISOString(),
      userName: pick(staff),
      section: "grocery",
      action: kind,
      itemName: item.name,
      delta,
      suspicious: reasons.length > 0,
      reason: reasons.join("; ") || undefined,
      reviewed: false,
    };
  }).sort((a, b) => b.at.localeCompare(a.at));

  // bright idea
  const regions = ["North", "South", "East", "West", "Central"];
  const brightDefs = [
    "LED Bulb 9W",
    "LED Tube Light 20W",
    "Ceiling Fan 1200mm",
    "Table Lamp",
    "Extension Board 4-way",
    "Solar Garden Light",
    "Emergency Lamp",
    "Smart Plug",
    "Decorative String Lights",
    "Panel Light 15W",
    "Night Lamp",
    "Torch Rechargeable",
    "Wall Switch Set",
    "Copper Wire 90m",
    "Inverter Bulb 12W",
  ];
  const brightSuppliers = [
    "Lumen India",
    "BrightCo Pvt Ltd",
    "Philtronics",
    "Voltline Supplies",
    "Shine Electricals",
  ];
  const bright: BrightProduct[] = brightDefs.map((name, i) => {
    const minQuantity = int(20, 50);
    return {
      id: id("p"),
      productName: name,
      supplierName: pick(brightSuppliers),
      region: regions[i % regions.length],
      quantity: i % 4 === 1 ? int(2, minQuantity - 1) : int(minQuantity + 5, 400),
      minQuantity,
      unitPrice: int(60, 2400),
      barcode: `891${String(2000000000 + i * 6131)}`,
    };
  });

  // raw material
  const rawDefs: [string, RawCategory, number, number][] = [
    ["Wheat", "Grain", 180, 26],
    ["Paddy Rice", "Grain", 240, 32],
    ["Maize", "Grain", 150, 21],
    ["Chana", "Pulse", 270, 62],
    ["Moong", "Pulse", 240, 88],
    ["Masoor", "Pulse", 270, 74],
    ["Onion", "Vegetable", 30, 22],
    ["Potato", "Vegetable", 45, 18],
    ["Tomato", "Vegetable", 10, 28],
    ["Chicken", "Meat", 3, 165],
    ["Mutton", "Meat", 4, 560],
    ["Fish (Rohu)", "Meat", 2, 210],
  ];
  const origins = [
    "Punjab",
    "Haryana",
    "Madhya Pradesh",
    "Maharashtra",
    "Andhra Pradesh",
    "Uttar Pradesh",
    "Imported – Australia",
  ];
  const rawSuppliers = [
    "Kisan Agro Co-op",
    "Bharat Grains",
    "GreenField Farms",
    "Coastal Fisheries",
    "Prime Meats",
  ];
  const imports: RawImport[] = [];
  for (let i = 0; i < 46; i++) {
    const [product, category, shelf, cost] = rawDefs[i % rawDefs.length];
    imports.push({
      id: id("i"),
      product,
      category,
      supplier: pick(rawSuppliers),
      origin: pick(origins),
      arrivalDate: isoDate(addDays(t0, -int(0, 175))),
      shelfLifeDays: shelf,
      quantity: category === "Meat" ? int(80, 400) : int(500, 4000),
      costPerKg: Math.round(cost * (0.9 + r() * 0.2)),
    });
  }
  imports.sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));

  const dests = [
    "Delhi",
    "Mumbai",
    "Kolkata",
    "Dubai, UAE",
    "Dhaka, Bangladesh",
    "Kathmandu, Nepal",
    "Chennai",
  ];
  const exports: RawExport[] = [];
  for (let i = 0; i < 28; i++) {
    const [product, category, , cost] = rawDefs[(i * 7) % rawDefs.length];
    const d = addDays(t0, -int(-6, 170));
    const days = Math.round((t0.getTime() - d.getTime()) / 86_400_000);
    exports.push({
      id: id("e"),
      shipmentNo: `SHP-${String(24100 + i)}`,
      product,
      category,
      quantity: category === "Meat" ? int(40, 200) : int(300, 2000),
      destination: pick(dests),
      buyer: pick([
        "Annapurna Foods",
        "Global Agri Exports",
        "City Mart Chain",
        "Hotel Supplies Co",
        "Al Noor Trading",
      ]),
      carrier: pick(["Blue Dart Cargo", "VRL Logistics", "Gati", "Maersk"]),
      vehicleNo: `MH-${int(10, 50)}-${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}-${int(1000, 9999)}`,
      exportDate: isoDate(d),
      pricePerKg: Math.round(cost * (1.15 + r() * 0.3)),
      status: days < 0 ? "preparing" : days < 5 ? "shipped" : "delivered",
    });
  }
  exports.sort((a, b) => b.exportDate.localeCompare(a.exportDate));

  // transactions (accounts + reports)
  const transactions: Transaction[] = [];
  for (const im of imports) {
    transactions.push({
      id: id("t"),
      date: im.arrivalDate,
      type: "buying",
      section: "raw-material",
      description: `Import: ${im.product} ${im.quantity} kg`,
      party: im.supplier,
      amount: im.quantity * im.costPerKg,
      paid: r() > 0.2,
      archived: false,
    });
  }
  for (const ex of exports) {
    transactions.push({
      id: id("t"),
      date: ex.exportDate,
      type: "selling",
      section: "raw-material",
      description: `Export ${ex.shipmentNo}: ${ex.product} ${ex.quantity} kg`,
      party: ex.buyer,
      amount: ex.quantity * ex.pricePerKg,
      paid: ex.status === "delivered" ? r() > 0.15 : false,
      archived: false,
    });
  }
  for (let m = 0; m < 180; m += 3) {
    const date = isoDate(addDays(t0, -m));
    transactions.push({
      id: id("t"),
      date,
      type: "selling",
      section: "grocery",
      description: "Grocery counter sales",
      party: "Walk-in customers",
      amount: int(18000, 52000),
      paid: true,
      archived: false,
      by: pick(["Ravi Kumar", "Anita Singh", "Mohit Verma"]),
    });
    if (m % 9 === 0) {
      transactions.push({
        id: id("t"),
        date,
        type: "buying",
        section: pick(["grocery", "bright-idea"] as const),
        description: "Stock purchase",
        party: pick([...suppliers, ...brightSuppliers]),
        amount: int(40000, 150000),
        paid: r() > 0.25,
        archived: false,
      });
      transactions.push({
        id: id("t"),
        date,
        type: "selling",
        section: "bright-idea",
        description: "Bright Idea dealer sales",
        party: pick(["Raj Electricals", "Prakash Lighting", "HomeStore", "City Electric"]),
        amount: int(30000, 120000),
        paid: r() > 0.2,
        archived: false,
      });
    }
    if (m % 30 === 0) {
      for (const [d, a] of [
        ["Staff salaries", 185000],
        ["Warehouse rent", 95000],
        ["Electricity", 28000],
      ] as const) {
        transactions.push({
          id: id("t"),
          date,
          type: "expense",
          section: "general",
          description: d,
          party: d === "Staff salaries" ? "Payroll" : "Vendor",
          amount: a + int(-5000, 5000),
          paid: true,
          archived: false,
        });
      }
    }
  }
  for (const t of transactions) if (t.date < isoDate(addDays(t0, -120))) t.archived = true;
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  // some sales per rep so the performance page has data
  for (let k = 0; k < 21; k++) {
    for (const rep of ["Ravi Kumar", "Anita Singh"]) {
      const g = pick(grocery);
      const q = int(2, 12);
      transactions.push({
        id: id("t"),
        date: isoDate(addDays(t0, -k)),
        type: "selling",
        section: "grocery",
        description: `Sale: ${g.name} × ${q}`,
        party: "Walk-in customer",
        amount: q * g.sellPrice * int(3, 9),
        paid: true,
        archived: false,
        by: rep,
      });
    }
  }
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  // suppliers
  const people = [
    "Suresh Patel",
    "Meena Joshi",
    "Arjun Rao",
    "Kavita Nair",
    "Vikram Malhotra",
    "Pooja Iyer",
    "Sanjay Gupta",
    "Neha Kapoor",
    "Imran Shaikh",
    "Deepak Yadav",
  ];
  const cities = ["Delhi", "Mumbai", "Pune", "Indore", "Lucknow", "Ahmedabad", "Jaipur", "Ludhiana"];
  const mkSupplier = (name: string, sec: Supplier["sections"]): Supplier => ({
    id: id("s"),
    name,
    contactPerson: pick(people),
    phone: `+91 ${int(70000, 99999)} ${int(10000, 99999)}`,
    email: `orders@${name
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .slice(0, 14)}.in`,
    address: `${int(1, 220)}, Industrial Area, ${pick(cities)}`,
    gstin: `${int(10, 36)}AAB${String.fromCharCode(65 + int(0, 25))}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}1Z${int(1, 9)}`,
    sections: sec,
    paymentTermsDays: pick([15, 30, 45]),
    notes: "",
  });
  const supplierList: Supplier[] = [
    ...suppliers.map((n) => mkSupplier(n, ["grocery"])),
    ...brightSuppliers.map((n) => mkSupplier(n, ["bright-idea"])),
    ...rawSuppliers.map((n) => mkSupplier(n, ["raw-material"])),
  ];

  // purchase orders
  const purchaseOrders: PurchaseOrder[] = [];
  let poSeq = 3001;
  const makePO = (section: "grocery" | "bright-idea", daysAgo: number, status: PurchaseOrder["status"]) => {
    const sup = pick(supplierList.filter((x) => x.sections.includes(section)));
    const pool =
      section === "grocery"
        ? grocery.map((g) => ({ refId: g.id, name: g.name, price: g.costPrice }))
        : bright.map((b) => ({ refId: b.id, name: b.productName, price: b.unitPrice }));
    const chosen = new Set<number>();
    const nLines = int(2, 4);
    while (chosen.size < nLines) chosen.add(int(0, pool.length - 1));
    const created = addDays(t0, -daysAgo);
    const expected = addDays(created, int(3, 7));
    const drift = 1 + (180 - daysAgo) / 1800;
    const lines = [...chosen].map((ix) => {
      const p = pool[ix];
      const qty = section === "grocery" ? int(24, 120) : int(20, 150);
      return {
        refId: p.refId,
        name: p.name,
        qty,
        unitPrice: Math.round(p.price * drift * (0.94 + r() * 0.1)),
        receivedQty: status === "received" ? qty : status === "partial" ? Math.floor(qty / 2) : 0,
      };
    });
    const late = int(-1, 4);
    purchaseOrders.push({
      id: id("po"),
      poNo: `PO-${poSeq++}`,
      supplierId: sup.id,
      section,
      lines,
      createdOn: isoDate(created),
      createdBy: "Admin",
      expectedOn: isoDate(expected),
      receivedOn: status === "received" ? isoDate(addDays(expected, late)) : undefined,
      status,
      rating:
        status === "received"
          ? Math.max(1, Math.min(5, 5 - Math.max(0, late - 1) - (r() < 0.2 ? 1 : 0)))
          : undefined,
      notes: "",
    });
  };
  for (let k = 0; k < 22; k++) makePO(k % 3 === 2 ? "bright-idea" : "grocery", int(14, 175), "received");
  makePO("grocery", 4, "sent");
  purchaseOrders[purchaseOrders.length - 1].expectedOn = isoDate(t0);
  makePO("grocery", 9, "sent"); // overdue
  purchaseOrders[purchaseOrders.length - 1].expectedOn = isoDate(addDays(t0, -2));
  makePO("bright-idea", 6, "partial");
  purchaseOrders[purchaseOrders.length - 1].expectedOn = isoDate(addDays(t0, -1));
  makePO("bright-idea", 1, "sent");
  purchaseOrders[purchaseOrders.length - 1].expectedOn = isoDate(addDays(t0, 3));
  makePO("grocery", 0, "draft");
  purchaseOrders.sort((a, b) => b.createdOn.localeCompare(a.createdOn));

  // tasks
  const reps = ["Ravi Kumar", "Anita Singh"];
  const taskTitles: [string, Task["kind"]][] = [
    ["Clean and re-label dairy fridge", "other"],
    ["Count spices aisle", "count"],
    ["Restock biscuits & snacks shelf", "restock"],
    ["Check LED bulb cartons for damage", "other"],
    ["Unload Metro Wholesale delivery", "receive"],
    ["Prepare onion shipment paperwork", "ship"],
    ["Rotate bread stock (oldest to front)", "restock"],
    ["Count Bright Idea – North region", "count"],
  ];
  const tasks: Task[] = [];
  taskTitles.forEach(([title, kind], i) => {
    const due = addDays(t0, i < 4 ? 0 : i < 6 ? 1 : -1);
    tasks.push({
      id: id("k"),
      title,
      kind,
      assignedTo: reps[i % 2],
      createdBy: "Admin",
      dueOn: isoDate(due),
      done: false,
    });
  });
  for (let k = 0; k < 40; k++) {
    const who = reps[k % 2];
    const at = addDays(t0, -int(0, 20));
    at.setHours(int(9, 19), int(0, 59));
    const [title, kind] = pick(taskTitles);
    tasks.push({
      id: id("k"),
      title,
      kind,
      assignedTo: who,
      createdBy: "Admin",
      dueOn: isoDate(at),
      done: true,
      doneBy: who,
      doneAt: at.toISOString(),
    });
  }

  // handover notes
  const hn = (
    h: number,
    author: string,
    shift: HandoverNote["shift"],
    priority: HandoverNote["priority"],
    section: HandoverNote["section"],
    text: string,
    ack: string[],
  ): HandoverNote => {
    const at = new Date(t0.getTime() - h * 3_600_000);
    return { id: id("h"), at: at.toISOString(), author, shift, priority, section, text, acknowledgedBy: ack };
  };
  const handover: HandoverNote[] = [
    hn(
      3,
      "Anita Singh",
      "Morning",
      "urgent",
      "grocery",
      "Fridge 2 not cooling properly (8°C). Moved paneer and curd to fridge 1. Technician called, coming after 4 pm.",
      [],
    ),
    hn(
      10,
      "Ravi Kumar",
      "Evening",
      "normal",
      "raw-material",
      "Onion lot from Maharashtra unloaded, 2 bags torn — kept separately near gate 3.",
      ["Admin"],
    ),
    hn(
      26,
      "Ravi Kumar",
      "Evening",
      "normal",
      "bright-idea",
      "Lumen India said the LED tube order will come on Friday, not Thursday.",
      ["Admin", "Anita Singh"],
    ),
    hn(
      34,
      "Anita Singh",
      "Morning",
      "normal",
      "general",
      "Loading dock light is flickering. Please bring a replacement tube.",
      ["Ravi Kumar"],
    ),
    hn(
      50,
      "Admin",
      "Morning",
      "normal",
      "general",
      "Stock count of the spices aisle this weekend. Please finish shelf restocking by Friday evening.",
      ["Ravi Kumar", "Anita Singh"],
    ),
  ];

  // stock counts
  const counts: StockCount[] = [];
  for (let k = 0; k < 4; k++) {
    const at = addDays(t0, -(k * 6 + 2));
    at.setHours(18, 30);
    const items = grocery.slice(k * 6, k * 6 + 6);
    counts.push({
      id: id("c"),
      at: at.toISOString(),
      by: reps[k % 2],
      section: "grocery",
      location: k % 2 ? "Store room" : "Shelf",
      lines: items.map((g) => {
        const expected = k % 2 ? g.storeQty : g.shelfQty;
        return {
          refId: g.id,
          name: g.name,
          expected,
          counted: Math.max(0, expected + (r() < 0.7 ? 0 : int(-4, 2))),
        };
      }),
      posted: true,
    });
  }

  // approval requests
  const milk = grocery.find((g) => g.name.startsWith("Toned Milk"))!;
  const curd = grocery.find((g) => g.name.startsWith("Curd"))!;
  const fan = bright.find((b) => b.productName.startsWith("Ceiling Fan"))!;
  const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const approvals: ApprovalRequest[] = [
    {
      id: id("r"),
      at: ago(2),
      requestedBy: "Ravi Kumar",
      section: "grocery",
      kind: "Adjustment",
      summary: `${milk.name}: -30 (store room) — Count correction after stock count`,
      value: 30 * milk.costPrice,
      action: {
        type: "grocery-adjust",
        itemId: milk.id,
        delta: -30,
        reason: "Count correction after stock count",
        where: "storeQty",
      },
      status: "pending",
      seenByRequester: true,
    },
    {
      id: id("r"),
      at: ago(5),
      requestedBy: "Anita Singh",
      section: "grocery",
      kind: "Write-off",
      summary: `${curd.name}: write off 12 — Fridge 2 failure, spoiled`,
      value: 12 * curd.costPrice,
      action: { type: "grocery-writeoff", itemId: curd.id, qty: 12, reason: "Fridge 2 failure, spoiled" },
      status: "pending",
      seenByRequester: true,
    },
    (() => {
      const shipment = {
        id: id("e"),
        shipmentNo: "SHP-24190",
        product: "Onion",
        category: "Vegetable" as const,
        quantity: 800,
        destination: "Dhaka, Bangladesh",
        buyer: "Al Noor Trading",
        carrier: "VRL Logistics",
        vehicleNo: "MH-12-KT-4471",
        exportDate: isoDate(addDays(t0, 1)),
        pricePerKg: 27,
        status: "preparing" as const,
      };
      return {
        id: id("r"),
        at: ago(7),
        requestedBy: "Ravi Kumar",
        section: "raw-material" as const,
        kind: "Export" as const,
        summary: `SHP-24190: Onion 800 kg → Al Noor Trading, Dhaka, Bangladesh`,
        value: 800 * 27,
        action: { type: "raw-export" as const, shipment },
        status: "pending" as const,
        seenByRequester: true,
      };
    })(),
    {
      id: id("r"),
      at: ago(30),
      requestedBy: "Ravi Kumar",
      section: "bright-idea",
      kind: "Write-off",
      summary: `${fan.productName}: -3 — Damaged in transit`,
      value: 3 * fan.unitPrice,
      action: { type: "bright-adjust", productId: fan.id, delta: -3, reason: "Damaged in transit" },
      status: "approved",
      decidedBy: "Admin",
      decidedAt: ago(26),
      note: "OK, claim with carrier",
      seenByRequester: true,
    },
    {
      id: id("r"),
      at: ago(54),
      requestedBy: "Anita Singh",
      section: "grocery",
      kind: "Adjustment",
      summary: `${grocery[0].name}: -45 (store room) — Recount`,
      value: 45 * grocery[0].costPrice,
      action: {
        type: "grocery-adjust",
        itemId: grocery[0].id,
        delta: -45,
        reason: "Recount",
        where: "storeQty",
      },
      status: "rejected",
      decidedBy: "Admin",
      decidedAt: ago(50),
      note: "Please recount with Ravi before adjusting",
      seenByRequester: true,
    },
  ];

  return {
    version: 2,
    settings: {
      firmName: "Sharma Warehousing Pvt Ltd",
      ownerName: "Rajesh Sharma",
      currency: "₹",
      expiryWarningDays: 15,
      approvalThreshold: 20,
      approveWriteOffs: true,
      approveExports: true,
    },
    users: [
      {
        id: "u1",
        name: "Admin",
        email: "admin@erp.com",
        password: "admin123",
        role: "admin",
        active: true,
        sections: ["grocery", "bright-idea", "raw-material"],
        monthlySalesTarget: 0,
        weeklyTaskTarget: 0,
      },
      {
        id: "u2",
        name: "Ravi Kumar",
        email: "rep@erp.com",
        password: "rep123",
        role: "rep",
        active: true,
        sections: ["grocery", "bright-idea", "raw-material"],
        monthlySalesTarget: 250000,
        weeklyTaskTarget: 15,
      },
      {
        id: "u3",
        name: "Anita Singh",
        email: "anita@erp.com",
        password: "rep123",
        role: "rep",
        active: true,
        sections: ["grocery"],
        monthlySalesTarget: 200000,
        weeklyTaskTarget: 12,
      },
      {
        id: "u4",
        name: "Mohit Verma",
        email: "mohit@erp.com",
        password: "rep123",
        role: "rep",
        active: false,
        sections: ["raw-material"],
        monthlySalesTarget: 150000,
        weeklyTaskTarget: 10,
      },
    ],
    grocery,
    backlog,
    activity,
    bright,
    imports,
    exports,
    transactions,
    approvals,
    suppliers: supplierList,
    purchaseOrders,
    tasks,
    handover,
    counts,
  };
}
