export type Role = "partner_operator" | "driver";

export type JobStatus =
  | "Booked"
  | "Awaiting Collection"
  | "Collected"
  | "In Transit"
  | "At Delivery"
  | "Completed"
  | "Flagged";

export type VerificationStatus = "Pending" | "Verified" | "Flagged" | "Review Cleared";

export type SealStatus = "Available" | "Paired" | "Active" | "Breach Detected" | "Retired";

export type ItemCategory =
  | "Property Keys"
  | "Signed Agreement"
  | "Confidential Documents"
  | "Legal Papers"
  | "Other Sensitive Item";

export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
}

export interface Driver {
  id: string;
  name: string;
  ref: string;
  email: string;
}

export interface CustodyJob {
  id: string;
  reference: string;
  trackingRef: string;
  itemDescription: string;
  itemCategory: ItemCategory;
  collection: GeoPoint;
  delivery: GeoPoint;
  driverId: string | null;
  sealId: string | null;
  collectionAt: string;
  deliveryAt: string;
  status: JobStatus;
  verification: VerificationStatus;
  preFlagStatus?: JobStatus;
  currentCustodian: string;
  deliveryEvidenceSubmitted: boolean;
  completedAt?: string;
  source: "partner" | "direct";
  customerName?: string;
  createdAt: string;
}

export type EventType =
  | "Job Booked"
  | "Smart-Seal Paired"
  | "Item Collected"
  | "Custody Handover"
  | "Item In Transit"
  | "Seal Breach Detected"
  | "Arrived At Delivery"
  | "Delivery Evidence Recorded"
  | "Delivery Completed";

export type Evidence = "Photo" | "GPS" | "Signature" | "Note" | "Seal Telemetry";

export interface CustodyEvent {
  id: string;
  jobId: string;
  type: EventType;
  timestamp: string;
  location: GeoPoint;
  custodian: string;
  sealStatus: SealStatus;
  evidence: Evidence[];
  verification: "Verified" | "Flagged";
  note?: string;
}

export interface SmartSeal {
  id: string;
  status: SealStatus;
  jobId: string | null;
  driverId: string | null;
  lastEvent: string;
  integrity: "Intact" | "Breach" | "Not In Use";
}

export type AnomalyType =
  | "Unexpected Smart-Seal Breach"
  | "GPS Location Mismatch"
  | "Implausible Event Timing"
  | "Missing Custody Evidence"
  | "Custody Sequence Inconsistency";

export interface Anomaly {
  id: string;
  jobId: string;
  eventId: string;
  type: AnomalyType;
  detectedAt: string;
  severity: "Low" | "Medium" | "High";
  reviewStatus: "Open" | "Reviewed" | "Kept Flagged";
  expected: string;
  recorded: string;
  reason: string;
}

export interface DemoAccount {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  demoCredentialVerifier: string;
  createdAt: string;
  updatedAt: string;
}
