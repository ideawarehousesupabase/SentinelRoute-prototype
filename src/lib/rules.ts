import type { Anomaly, CustodyEvent, CustodyJob, GeoPoint } from "./types";

export const GPS_TOLERANCE_KM = 0.5;

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export type AnomalyDraft = Omit<Anomaly, "id" | "reviewStatus" | "detectedAt" | "eventId">;

/**
 * Deterministic, rule-based checks applied to a new custody event.
 * These are illustrative prototype rules, not a trained model. A match means "review required", not fraud.
 */
export function detectAnomalies(
  job: CustodyJob,
  prior: CustodyEvent[],
  next: CustodyEvent,
): AnomalyDraft[] {
  const out: AnomalyDraft[] = [];
  const last = prior[prior.length - 1];

  if (next.sealStatus === "Breach Detected") {
    out.push({
      jobId: job.id,
      type: "Unexpected Smart-Seal Breach",
      severity: "High",
      expected: "Seal remains intact until delivery confirmation",
      recorded: `Seal reported 'Breach Detected' during ${next.type}`,
      reason: "Seal integrity changed before delivery was completed. Requires operator review.",
    });
  }

  if (next.type === "Delivery Evidence Recorded") {
    const d = distanceKm(next.location, job.delivery);
    if (d > GPS_TOLERANCE_KM) {
      out.push({
        jobId: job.id,
        type: "GPS Location Mismatch",
        severity: "Medium",
        expected: `Within ${GPS_TOLERANCE_KM} km of ${job.delivery.label}`,
        recorded: `Recorded ${d.toFixed(1)} km away (${next.location.label})`,
        reason: "Recorded delivery location does not match the booked destination.",
      });
    }
    const missing = (["Photo", "Signature"] as const).filter((e) => !next.evidence.includes(e));
    if (missing.length) {
      out.push({
        jobId: job.id,
        type: "Missing Custody Evidence",
        severity: "Medium",
        expected: "Delivery photo and recipient signature",
        recorded: `Missing: ${missing.join(", ")}`,
        reason: "Delivery evidence is incomplete.",
      });
    }
    if (!prior.some((e) => e.type === "Item Collected")) {
      out.push({
        jobId: job.id,
        type: "Custody Sequence Inconsistency",
        severity: "High",
        expected: "Collection recorded before delivery",
        recorded: "Delivery recorded with no collection event",
        reason: "Custody sequence is out of order.",
      });
    }
  }

  if (last) {
    const dtH =
      (new Date(next.timestamp).getTime() - new Date(last.timestamp).getTime()) / 3_600_000;
    if (dtH < 0) {
      out.push({
        jobId: job.id,
        type: "Implausible Event Timing",
        severity: "Medium",
        expected: `Timestamp after previous event (${last.type})`,
        recorded: `Timestamp is ${Math.round(-dtH * 60)} min before the previous event`,
        reason: "Event timestamps are out of chronological order.",
      });
    }
  }
  return out;
}

/** Illustrative (non-cryptographic) 64-bit FNV-1a style hash for the ledger visual. */
export function illustrativeHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2246822507) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).repeat(2);
}

export function certificateEligible(job: CustodyJob, openAnomalies: number): boolean {
  return job.status === "Completed" && job.verification === "Verified" && openAnomalies === 0;
}
