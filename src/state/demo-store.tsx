import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mockJobs } from "@/data/mockJobs";
import { mockCustodyEvents } from "@/data/mockCustodyEvents";
import { mockSeals } from "@/data/mockSeals";
import { mockAnomalies } from "@/data/mockAnomalies";
import { mockDrivers } from "@/data/mockDrivers";
import { detectAnomalies } from "@/lib/rules";
import type {
  Anomaly,
  CustodyEvent,
  CustodyJob,
  Driver,
  Evidence,
  GeoPoint,
  ItemCategory,
  SealStatus,
  SmartSeal,
} from "@/lib/types";

const STORAGE_KEY = "sentinelroute-demo-state-v1";

interface DemoState {
  jobs: CustodyJob[];
  events: CustodyEvent[];
  seals: SmartSeal[];
  anomalies: Anomaly[];
  counter: number;
}

const seed = (): DemoState => ({
  jobs: structuredClone(mockJobs),
  events: structuredClone(mockCustodyEvents),
  seals: structuredClone(mockSeals),
  anomalies: structuredClone(mockAnomalies),
  counter: 100,
});

export interface NewJobInput {
  reference: string;
  itemDescription: string;
  itemCategory: ItemCategory;
  collection: string;
  delivery: string;
  driverId: string;
  sealId: string;
  collectionAt: string;
  deliveryAt: string;
}

export interface DeliveryInput {
  photo: boolean;
  signature: boolean;
  sealCondition: "Intact" | "Damaged";
  simulateGpsMismatch: boolean;
  simulateTimingIssue: boolean;
}

// Deterministic mock geocoding for free-text addresses: near central London.
function mockGeo(label: string): GeoPoint {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return {
    label,
    lat: 51.48 + ((h % 1000) / 1000) * 0.07,
    lng: -0.2 + (((h >> 10) % 1000) / 1000) * 0.18,
  };
}

function trackingCode(n: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  let x = n * 7919 + 104729;
  for (let i = 0; i < 4; i++) {
    s += chars[x % chars.length];
    x = Math.floor(x / chars.length) + 17;
  }
  return s;
}

interface Ctx extends DemoState {
  drivers: Driver[];
  driverById: (id: string | null) => Driver | undefined;
  eventsFor: (jobId: string) => CustodyEvent[];
  openAnomaliesFor: (jobId: string) => Anomaly[];
  createJob: (input: NewJobInput) => CustodyJob;
  createBooking: (input: {
    customerName: string;
    email: string;
    collection: string;
    delivery: string;
    itemDescription: string;
    collectionAt: string;
  }) => CustodyJob;
  assignDriver: (jobId: string, driverId: string) => void;
  pairSeal: (jobId: string) => void;
  recordCollection: (jobId: string, input: { photo: boolean; note: string }) => void;
  recordHandover: (
    jobId: string,
    input: { newCustodian: string; location: string; sealCondition: "Intact" | "Damaged" },
  ) => void;
  startTransit: (jobId: string) => void;
  simulateBreach: (jobId: string) => void;
  arrive: (jobId: string) => void;
  submitDelivery: (jobId: string, input: DeliveryInput) => { flagged: boolean; reasons: string[] };
  reviewAnomaly: (id: string, outcome: "Reviewed" | "Kept Flagged") => void;
  pairDevice: (sealId: string, jobId: string) => void;
  retireSeal: (sealId: string) => void;
  resetDemo: () => void;
}

const DemoCtx = createContext<Ctx | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(seed);
  const loaded = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore corrupt state */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const driverById = useCallback((id: string | null) => mockDrivers.find((d) => d.id === id), []);
  const custodianName = (job: CustodyJob) => {
    const d = mockDrivers.find((x) => x.id === job.driverId);
    return d ? `${d.name} (${d.ref})` : "Unassigned";
  };

  /** Appends an event, runs rule checks, and flags the job when a rule matches. */
  const append = (
    s: DemoState,
    jobId: string,
    e: Omit<CustodyEvent, "id" | "jobId" | "verification">,
    jobPatch: Partial<CustodyJob> = {},
    sealStatus?: SealStatus,
  ): { s: DemoState; drafts: ReturnType<typeof detectAnomalies> } => {
    const job = s.jobs.find((j) => j.id === jobId)!;
    const counter = s.counter + 1;
    const event: CustodyEvent = {
      ...e,
      id: `EVT-${6000 + counter}`,
      jobId,
      verification: "Verified",
    };
    const prior = s.events.filter((x) => x.jobId === jobId);
    const drafts = detectAnomalies(job, prior, event);
    if (drafts.length) event.verification = "Flagged";
    const newAnoms: Anomaly[] = drafts.map((d, i) => ({
      ...d,
      id: `ALT-${400 + counter * 3 + i}`,
      eventId: event.id,
      detectedAt: new Date().toISOString(),
      reviewStatus: "Open",
    }));
    let patched: CustodyJob = { ...job, ...jobPatch };
    if (drafts.length) {
      patched = {
        ...patched,
        preFlagStatus: patched.status === "Flagged" ? job.preFlagStatus : patched.status,
        status: "Flagged",
        verification: "Flagged",
      };
    }
    const seals =
      sealStatus && job.sealId
        ? s.seals.map((x) =>
            x.id === job.sealId
              ? {
                  ...x,
                  status: sealStatus,
                  jobId: sealStatus === "Available" ? null : jobId,
                  driverId: sealStatus === "Available" ? null : job.driverId,
                  integrity:
                    sealStatus === "Breach Detected"
                      ? ("Breach" as const)
                      : sealStatus === "Available"
                        ? ("Not In Use" as const)
                        : ("Intact" as const),
                  lastEvent: `${e.type} — ${job.reference}`,
                }
              : x,
          )
        : s.seals;
    return {
      s: {
        ...s,
        counter,
        events: [...s.events, event],
        anomalies: [...s.anomalies, ...newAnoms],
        seals,
        jobs: s.jobs.map((j) => (j.id === jobId ? patched : j)),
      },
      drafts,
    };
  };

  const sealStatusOf = (s: DemoState, job: CustodyJob): SealStatus =>
    s.seals.find((x) => x.id === job.sealId)?.status ?? "Available";
  const getJob = (s: DemoState, id: string) => s.jobs.find((j) => j.id === id)!;
  const nowIso = () => new Date().toISOString();

  const api = useMemo<Omit<Ctx, keyof DemoState | "drivers" | "driverById">>(
    () => ({
      eventsFor: (jobId) =>
        stateRef.current.events
          .filter((e) => e.jobId === jobId)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ||
              a.id.localeCompare(b.id, undefined, { numeric: true }),
          ),
      openAnomaliesFor: (jobId) =>
        stateRef.current.anomalies.filter(
          (a) => a.jobId === jobId && a.reviewStatus !== "Reviewed",
        ),

      createJob: (input) => {
        const s = stateRef.current;
        const targetSeal = s.seals.find((x) => x.id === input.sealId);
        if (
          targetSeal &&
          (targetSeal.status !== "Available" || (targetSeal.jobId && targetSeal.jobId !== ""))
        ) {
          throw new Error("Selected smart-seal is already in use or assigned to another job.");
        }
        const n = s.counter + 1;
        const job: CustodyJob = {
          id: `job-${Date.now()}`,
          reference: input.reference.trim(),
          trackingRef: `TRK-${trackingCode(n)}-${input.reference.slice(-2)}`,
          itemDescription: input.itemDescription,
          itemCategory: input.itemCategory,
          collection: mockGeo(input.collection),
          delivery: mockGeo(input.delivery),
          driverId: input.driverId,
          sealId: input.sealId,
          collectionAt: new Date(input.collectionAt).toISOString(),
          deliveryAt: new Date(input.deliveryAt).toISOString(),
          status: "Booked",
          verification: "Pending",
          currentCustodian: `Sender: ${input.collection}`,
          deliveryEvidenceSubmitted: false,
          source: "partner",
          createdAt: nowIso(),
        };
        let next: DemoState = { ...s, counter: n, jobs: [job, ...s.jobs] };
        next = {
          ...next,
          seals: next.seals.map((x) =>
            x.id === job.sealId
              ? {
                  ...x,
                  jobId: job.id,
                  driverId: job.driverId,
                  lastEvent: `Assigned to ${job.reference}, awaiting pairing`,
                }
              : x,
          ),
        };
        next = append(next, job.id, {
          type: "Job Booked",
          timestamp: nowIso(),
          location: job.collection,
          custodian: "Partner Operator",
          sealStatus: "Available",
          evidence: [],
        }).s;
        setState(next);
        return job;
      },

      createBooking: (input) => {
        const s = stateRef.current;
        const n = s.counter + 1;
        const num = 2000 + n;
        const job: CustodyJob = {
          id: `job-d${Date.now()}`,
          reference: `SR-D${num}`,
          trackingRef: `TRK-${trackingCode(n)}-DIR`,
          itemDescription: input.itemDescription,
          itemCategory: "Other Sensitive Item",
          collection: mockGeo(input.collection),
          delivery: mockGeo(input.delivery),
          driverId: null,
          sealId: null,
          collectionAt: new Date(input.collectionAt).toISOString(),
          deliveryAt: new Date(new Date(input.collectionAt).getTime() + 2 * 3600_000).toISOString(),
          status: "Booked",
          verification: "Pending",
          currentCustodian: `Sender: ${input.customerName}`,
          deliveryEvidenceSubmitted: false,
          source: "direct",
          customerName: input.customerName,
          createdAt: nowIso(),
        };
        let next: DemoState = { ...s, counter: n, jobs: [job, ...s.jobs] };
        next = append(next, job.id, {
          type: "Job Booked",
          timestamp: nowIso(),
          location: job.collection,
          custodian: "Direct booking",
          sealStatus: "Available",
          evidence: [],
        }).s;
        setState(next);
        return job;
      },

      assignDriver: (jobId, driverId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const driver = mockDrivers.find((d) => d.id === driverId);
        if (!driver) return;
        const nextJobs = s.jobs.map((j) => (j.id === jobId ? { ...j, driverId } : j));
        const nextSeals = job.sealId
          ? s.seals.map((x) => (x.id === job.sealId ? { ...x, driverId } : x))
          : s.seals;
        setState({ ...s, jobs: nextJobs, seals: nextSeals });
      },

      pairSeal: (jobId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        if (!job.sealId) throw new Error("No smart-seal assigned to this job.");
        if (job.status !== "Booked") return; // Prevent double pairing if already past Booked
        const seal = s.seals.find((x) => x.id === job.sealId);
        if (!seal) throw new Error("Assigned smart-seal not found.");
        if (seal.status === "Retired") throw new Error("Retired smart-seals cannot be paired.");
        if (seal.status === "Breach Detected")
          throw new Error("Breached smart-seals cannot be paired.");
        if (seal.status !== "Available" && seal.jobId !== jobId) {
          throw new Error("Smart-seal is already paired or active on another job.");
        }
        setState(
          append(
            s,
            jobId,
            {
              type: "Smart-Seal Paired",
              timestamp: nowIso(),
              location: job.collection,
              custodian: custodianName(job),
              sealStatus: "Paired",
              evidence: ["Seal Telemetry"],
            },
            { status: "Awaiting Collection" },
            "Paired",
          ).s,
        );
      },

      recordCollection: (jobId, { photo, note }) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const evidence: Evidence[] = [
          "GPS",
          ...(photo ? (["Photo"] as Evidence[]) : []),
          ...(note ? (["Note"] as Evidence[]) : []),
        ];
        setState(
          append(
            s,
            jobId,
            {
              type: "Item Collected",
              timestamp: nowIso(),
              location: job.collection,
              custodian: custodianName(job),
              sealStatus: "Active",
              evidence,
              note: note || undefined,
            },
            { status: "Collected", currentCustodian: custodianName(job) },
            "Active",
          ).s,
        );
      },

      recordHandover: (jobId, { newCustodian, location, sealCondition }) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const loc = location ? mockGeo(location) : job.collection;
        const sealStatus: SealStatus = sealCondition === "Damaged" ? "Breach Detected" : "Active";
        setState(
          append(
            s,
            jobId,
            {
              type: "Custody Handover",
              timestamp: nowIso(),
              location: loc,
              custodian: `${job.currentCustodian} → ${newCustodian}`,
              sealStatus,
              evidence: ["Photo", "GPS", "Seal Telemetry"],
            },
            { currentCustodian: newCustodian },
            sealStatus,
          ).s,
        );
      },

      startTransit: (jobId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        setState(
          append(
            s,
            jobId,
            {
              type: "Item In Transit",
              timestamp: nowIso(),
              location: job.collection,
              custodian: job.currentCustodian,
              sealStatus: sealStatusOf(s, job),
              evidence: ["GPS", "Seal Telemetry"],
            },
            { status: "In Transit" },
          ).s,
        );
      },

      simulateBreach: (jobId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const mid: GeoPoint = {
          label: "En route (simulated position)",
          lat: (job.collection.lat + job.delivery.lat) / 2,
          lng: (job.collection.lng + job.delivery.lng) / 2,
        };
        setState(
          append(
            s,
            jobId,
            {
              type: "Seal Breach Detected",
              timestamp: nowIso(),
              location: mid,
              custodian: job.currentCustodian,
              sealStatus: "Breach Detected",
              evidence: ["Seal Telemetry", "GPS"],
            },
            {},
            "Breach Detected",
          ).s,
        );
      },

      arrive: (jobId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        setState(
          append(
            s,
            jobId,
            {
              type: "Arrived At Delivery",
              timestamp: nowIso(),
              location: job.delivery,
              custodian: job.currentCustodian,
              sealStatus: sealStatusOf(s, job),
              evidence: ["GPS"],
            },
            { status: "At Delivery" },
          ).s,
        );
      },

      submitDelivery: (jobId, input) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const evidence: Evidence[] = [
          "GPS",
          ...(input.photo ? (["Photo"] as Evidence[]) : []),
          ...(input.signature ? (["Signature"] as Evidence[]) : []),
        ];
        const location: GeoPoint = input.simulateGpsMismatch
          ? {
              label: "Unexpected location (simulated GPS offset)",
              lat: job.delivery.lat + 0.05,
              lng: job.delivery.lng + 0.04,
            }
          : job.delivery;
        const ts = input.simulateTimingIssue
          ? new Date(Date.now() - 3 * 3600_000).toISOString()
          : nowIso();
        const sealStatus: SealStatus =
          input.sealCondition === "Damaged" ? "Breach Detected" : sealStatusOf(s, job);
        const r = append(
          s,
          jobId,
          {
            type: "Delivery Evidence Recorded",
            timestamp: ts,
            location,
            custodian: job.currentCustodian,
            sealStatus,
            evidence,
          },
          { deliveryEvidenceSubmitted: true },
          sealStatus === "Breach Detected" ? "Breach Detected" : undefined,
        );
        let next = r.s;
        const open = next.anomalies.filter(
          (a) => a.jobId === jobId && a.reviewStatus !== "Reviewed",
        );
        if (open.length === 0) {
          const recipient = `Recipient at ${job.delivery.label}`;
          next = append(
            next,
            jobId,
            {
              type: "Delivery Completed",
              timestamp: nowIso(),
              location: job.delivery,
              custodian: recipient,
              sealStatus: "Available",
              evidence: ["Seal Telemetry"],
            },
            {
              status: "Completed",
              verification: "Verified",
              completedAt: nowIso(),
              currentCustodian: recipient,
            },
            "Available",
          ).s;
        }
        setState(next);
        return { flagged: open.length > 0, reasons: open.map((a) => a.type) };
      },

      reviewAnomaly: (id, outcome) => {
        const s = stateRef.current;
        const anomalies = s.anomalies.map((a) =>
          a.id === id ? { ...a, reviewStatus: outcome } : a,
        );
        const target = anomalies.find((a) => a.id === id)!;
        const stillOpen = anomalies.filter(
          (a) => a.jobId === target.jobId && a.reviewStatus !== "Reviewed",
        );
        let next: DemoState = { ...s, anomalies };
        if (stillOpen.length === 0) {
          const job = getJob(next, target.jobId);
          if (job.deliveryEvidenceSubmitted) {
            // Marking an alert reviewed must NOT automatically verify a flagged delivery.
            // The delivery was flagged due to anomalies; it remains unverified and flagged.
            // Keep status: "Flagged" and verification: "Flagged".
          } else {
            // If the issue was pre-delivery (e.g. In transit), operator review allows the driver
            // to continue their route, but verification remains Pending (not automatically Verified).
            next = {
              ...next,
              jobs: next.jobs.map((j) =>
                j.id === job.id
                  ? { ...j, status: j.preFlagStatus ?? "In Transit", verification: "Pending" }
                  : j,
              ),
            };
          }
        }
        setState(next);
      },

      pairDevice: (sealId, jobId) => {
        const s = stateRef.current;
        const job = getJob(s, jobId);
        const seal = s.seals.find((x) => x.id === sealId);
        if (!seal) throw new Error("Smart-seal not found.");
        if (seal.status !== "Available" || (seal.jobId && seal.jobId !== jobId)) {
          throw new Error("Smart-seal is not available or already paired to another job.");
        }
        if (job.status !== "Booked") {
          throw new Error("Only booked jobs can be paired with a seal.");
        }
        // Release any previously assigned seal on this job if it was not in active transit
        const seals = s.seals.map((x) =>
          x.jobId === jobId && x.id !== sealId && x.status === "Available"
            ? { ...x, jobId: null, driverId: null, lastEvent: "Unassigned" }
            : x,
        );
        const s2: DemoState = {
          ...s,
          seals,
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, sealId } : j)),
        };
        setState(
          append(
            s2,
            jobId,
            {
              type: "Smart-Seal Paired",
              timestamp: nowIso(),
              location: job.collection,
              custodian: custodianName(job),
              sealStatus: "Paired",
              evidence: ["Seal Telemetry"],
            },
            { status: "Awaiting Collection" },
            "Paired",
          ).s,
        );
      },

      retireSeal: (sealId) => {
        const s = stateRef.current;
        const seal = s.seals.find((x) => x.id === sealId);
        if (!seal || seal.status === "Retired") return;
        if (seal.status === "Active" || seal.status === "Paired") {
          throw new Error("Cannot retire an active or paired seal in custody transit.");
        }
        setState({
          ...s,
          seals: s.seals.map((x) =>
            x.id === sealId
              ? {
                  ...x,
                  status: "Retired",
                  jobId: null,
                  driverId: null,
                  integrity: "Not In Use",
                  lastEvent: "Retired by operator (demo)",
                }
              : x,
          ),
        });
      },

      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(seed());
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [],
  );

  const value: Ctx = {
    ...state,
    drivers: mockDrivers,
    driverById,
    ...api,
    eventsFor: (jobId) =>
      state.events
        .filter((e) => e.jobId === jobId)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ||
            a.id.localeCompare(b.id, undefined, { numeric: true }),
        ),
    openAnomaliesFor: (jobId) =>
      state.anomalies.filter((a) => a.jobId === jobId && a.reviewStatus !== "Reviewed"),
  };
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo must be used inside DemoStoreProvider");
  return c;
}
