import type { Anomaly } from "@/lib/types";
import { mockCustodyEvents } from "./mockCustodyEvents";

const breachEvt = mockCustodyEvents.find(
  (e) => e.jobId === "job-1044" && e.type === "Seal Breach Detected",
)!;
const gpsEvt = mockCustodyEvents.find(
  (e) => e.jobId === "job-1045" && e.type === "Delivery Evidence Recorded",
)!;

export const mockAnomalies: Anomaly[] = [
  {
    id: "ALT-301",
    jobId: "job-1044",
    eventId: breachEvt.id,
    type: "Unexpected Smart-Seal Breach",
    detectedAt: breachEvt.timestamp,
    severity: "High",
    reviewStatus: "Open",
    expected: "Seal remains intact until delivery confirmation",
    recorded: "Seal reported 'Breach Detected' mid-route on Marylebone Rd",
    reason:
      "Seal integrity changed before the delivery stage. Requires operator review — this does not by itself establish tampering.",
  },
  {
    id: "ALT-302",
    jobId: "job-1045",
    eventId: gpsEvt.id,
    type: "GPS Location Mismatch",
    detectedAt: gpsEvt.timestamp,
    severity: "Medium",
    reviewStatus: "Open",
    expected: "Delivery recorded within 0.5 km of Harrogate Estates, HG1 1BS",
    recorded: "Delivery recorded approx. 6 km away (Knaresborough HG5)",
    reason:
      "Recorded delivery location does not match the booked destination. Requires review — may reflect a GPS or address issue.",
  },
];
