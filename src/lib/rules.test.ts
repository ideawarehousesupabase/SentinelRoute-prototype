import { describe, expect, it } from "vitest";
import { detectAnomalies, certificateEligible } from "./rules";
import { mockJobs } from "@/data/mockJobs";
import type { CustodyEvent } from "./types";

const job = mockJobs.find((j) => j.id === "job-1047")!;
const collected: CustodyEvent = {
  id: "E1",
  jobId: job.id,
  type: "Item Collected",
  timestamp: "2026-10-21T16:30:00Z",
  location: job.collection,
  custodian: "x",
  sealStatus: "Active",
  evidence: ["Photo", "GPS"],
  verification: "Verified",
};
const delivery = (o: Partial<CustodyEvent>): CustodyEvent => ({
  ...collected,
  id: "E2",
  type: "Delivery Evidence Recorded",
  timestamp: "2026-10-21T17:10:00Z",
  location: job.delivery,
  evidence: ["Photo", "GPS", "Signature"],
  ...o,
});

describe("anomaly rules", () => {
  it("clean delivery raises no anomaly", () =>
    expect(detectAnomalies(job, [collected], delivery({}))).toHaveLength(0));
  it("seal breach is flagged", () =>
    expect(
      detectAnomalies(job, [collected], delivery({ sealStatus: "Breach Detected" })).map(
        (a) => a.type,
      ),
    ).toContain("Unexpected Smart-Seal Breach"));
  it("delivery more than 0.5 km away is a GPS mismatch", () =>
    expect(
      detectAnomalies(
        job,
        [collected],
        delivery({
          location: { label: "far", lat: job.delivery.lat + 0.01, lng: job.delivery.lng },
        }),
      ).map((a) => a.type),
    ).toContain("GPS Location Mismatch"));
  it("out-of-order timestamp is implausible timing", () =>
    expect(
      detectAnomalies(job, [collected], delivery({ timestamp: "2026-10-21T15:00:00Z" })).map(
        (a) => a.type,
      ),
    ).toContain("Implausible Event Timing"));
  it("missing signature is flagged", () =>
    expect(
      detectAnomalies(job, [collected], delivery({ evidence: ["Photo", "GPS"] })).map(
        (a) => a.type,
      ),
    ).toContain("Missing Custody Evidence"));
  it("flagged job is not certificate eligible", () =>
    expect(certificateEligible({ ...job, status: "Flagged", verification: "Flagged" }, 1)).toBe(
      false,
    ));
  it("flagged job with 0 open anomalies is still not certificate eligible", () =>
    expect(certificateEligible({ ...job, status: "Flagged", verification: "Flagged" }, 0)).toBe(
      false,
    ));
  it("clean completed job is certificate eligible", () =>
    expect(certificateEligible({ ...job, status: "Completed", verification: "Verified" }, 0)).toBe(
      true,
    ));
});
