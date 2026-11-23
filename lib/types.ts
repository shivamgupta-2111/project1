export type Role = "admin" | "rep";
export type Section = "grocery" | "bright-idea" | "raw-material";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // TODO: hash this once we have a backend
  role: Role;
  active: boolean;
  sections: Section[];
  monthlySalesTarget: number;
  weeklyTaskTarget: number;
}

// grocery
export interface GroceryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  storeQty: number; // back room
  shelfQty: number; // on the shelves
  reorderLevel: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  expiryDate: string; // yyyy-mm-dd
  addedOn: string;
  barcode: string;
}

export type BacklogStatus = "pending" | "in-progress" | "delayed" | "done";
export interface BacklogEntry {
  id: string;
  itemId: string;
  task: string;
  qty: number;
  createdOn: string;
  dueOn: string;
  status: BacklogStatus;
}

export interface ActivityLog {
  id: string;
  at: string;
  userName: string;
  section: Section;
  action: string;
  itemName: string;
  delta: number;
  suspicious: boolean;
  reason?: string;
  reviewed: boolean;
}

// bright idea
export interface BrightProduct {
  id: string;
  productName: string;
  supplierName: string;
  region: string;
  quantity: number;
  minQuantity: number; // show low stock alert below this
  unitPrice: number;
  barcode: string;
}

// raw material
export type RawCategory = "Grain" | "Pulse" | "Vegetable" | "Meat";
export const RAW_CATEGORIES: RawCategory[] = ["Grain", "Pulse", "Vegetable", "Meat"];

export interface RawImport {
  id: string;
  product: string;
  category: RawCategory;
  supplier: string;
  origin: string;
  arrivalDate: string;
  shelfLifeDays: number;
  quantity: number; // kg
  costPerKg: number;
}

export type ShipmentStatus = "preparing" | "shipped" | "delivered";
export interface RawExport {
  id: string;
  shipmentNo: string;
  product: string;
  category: RawCategory;
  quantity: number; // kg
  destination: string;
  buyer: string;
  carrier: string;
  vehicleNo: string;
  exportDate: string;
  pricePerKg: number;
  status: ShipmentStatus;
}

// accounts & reports
export type TxnType = "buying" | "selling" | "expense";
export interface Transaction {
  id: string;
  date: string;
  type: TxnType;
  section: Section | "general";
  description: string;
  party: string;
  amount: number;
  paid: boolean;
  archived: boolean;
  by?: string;
}

export interface Settings {
  firmName: string;
  ownerName: string;
  currency: string;
  expiryWarningDays: number;
  approvalThreshold: number;
  approveWriteOffs: boolean;
  approveExports: boolean;
}

export interface ErpData {
  version: number;
  settings: Settings;
  users: User[];
  grocery: GroceryItem[];
  backlog: BacklogEntry[];
  activity: ActivityLog[];
  bright: BrightProduct[];
  imports: RawImport[];
  exports: RawExport[];
  transactions: Transaction[];
  approvals: ApprovalRequest[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  tasks: Task[];
  handover: HandoverNote[];
  counts: StockCount[];
}

// actions & approvals
export type ErpAction =
  | { type: "grocery-receive"; itemId: string; qty: number }
  | { type: "grocery-adjust"; itemId: string; delta: number; reason: string; where: "storeQty" | "shelfQty" }
  | { type: "grocery-writeoff"; itemId: string; qty: number; reason: string }
  | { type: "grocery-move"; itemId: string; qty: number }
  | { type: "grocery-sell"; itemId: string; qty: number }
  | { type: "bright-in"; productId: string; qty: number }
  | { type: "bright-sell"; productId: string; qty: number }
  | { type: "bright-adjust"; productId: string; delta: number; reason: string }
  | { type: "raw-export"; shipment: RawExport };

export type ApprovalStatus = "pending" | "approved" | "rejected";
export interface ApprovalRequest {
  id: string;
  at: string;
  requestedBy: string;
  section: Section;
  kind: "Adjustment" | "Write-off" | "Export";
  summary: string;
  value: number;
  action: ErpAction;
  status: ApprovalStatus;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
  seenByRequester: boolean;
}

// suppliers & purchase orders
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  sections: Section[];
  paymentTermsDays: number;
  notes: string;
}

export type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";
export interface POLine {
  refId: string; // grocery id or bright idea id
  name: string;
  qty: number;
  unitPrice: number;
  receivedQty: number;
}
export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  section: "grocery" | "bright-idea";
  lines: POLine[];
  createdOn: string;
  createdBy: string;
  expectedOn: string;
  receivedOn?: string;
  status: POStatus;
  rating?: number; // 1-5
  notes: string;
}

// team
export interface Task {
  id: string;
  title: string;
  kind: "restock" | "receive" | "ship" | "count" | "other";
  assignedTo: string | null; // null = anyone
  createdBy: string;
  dueOn: string;
  done: boolean;
  doneBy?: string;
  doneAt?: string;
}

export interface HandoverNote {
  id: string;
  at: string;
  author: string;
  shift: "Morning" | "Evening" | "Night";
  priority: "normal" | "urgent";
  section: Section | "general";
  text: string;
  acknowledgedBy: string[];
}

export interface StockCountLine {
  refId: string;
  name: string;
  expected: number;
  counted: number;
}
export interface StockCount {
  id: string;
  at: string;
  by: string;
  section: "grocery" | "bright-idea";
  location: string;
  lines: StockCountLine[];
  posted: boolean;
}
