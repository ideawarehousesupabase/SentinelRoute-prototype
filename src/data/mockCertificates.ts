import type { CustodyJob } from "@/lib/types";

/** Certificates are derived from eligible completed jobs; this maps a job to its certificate reference. */
export function certificateRefFor(job: CustodyJob): string {
  return `CERT-${job.reference.replace("SR-", "")}-${job.trackingRef.slice(-4)}`;
}

export const mockCertificates = [
  { jobId: "job-1041", issuedAt: "2026-10-19T10:18:00.000Z" },
  { jobId: "job-1042", issuedAt: "2026-10-19T13:47:00.000Z" },
];
