import {
  Camera,
  FileSignature,
  MapPin,
  StickyNote,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { CustodyEvent, Evidence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fmt, Pill, SealIndicator } from "./primitives";

const evIcon: Record<Evidence, typeof Camera> = {
  Photo: Camera,
  GPS: MapPin,
  Signature: FileSignature,
  Note: StickyNote,
  "Seal Telemetry": Radio,
};

export function CustodyTimeline({
  events,
  publicView,
}: {
  events: CustodyEvent[];
  publicView?: boolean;
}) {
  if (!events.length)
    return <p className="text-sm text-muted-foreground">No custody events recorded yet.</p>;
  return (
    <ol className="relative space-y-5 border-l-2 border-border pl-6">
      {events.map((e) => {
        const flagged = e.verification === "Flagged";
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[33px] top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 bg-card",
                flagged ? "border-destructive text-destructive" : "border-success text-success",
              )}
            >
              {flagged ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </span>
            <div
              className={cn(
                "rounded-lg border p-3.5",
                flagged && "border-destructive/40 bg-destructive/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{e.type}</p>
                <Pill tone={flagged ? "danger" : "success"}>
                  {flagged ? "Flagged for review" : "Verified"}
                </Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-mono">{e.id}</span> · {fmt(e.timestamp)}
              </p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {publicView ? e.location.label.split(",").slice(-1)[0].trim() : e.location.label}
                </p>
                {!publicView && (
                  <p className="text-muted-foreground">
                    Custodian: <span className="text-foreground">{e.custodian}</span>
                  </p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SealIndicator status={e.sealStatus} />
                {!publicView && e.evidence.length > 0 && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    Evidence:
                    {e.evidence.map((x) => {
                      const I = evIcon[x];
                      return (
                        <span key={x} title={x} className="inline-flex items-center gap-1">
                          <I className="h-3.5 w-3.5" />
                          {x}
                        </span>
                      );
                    })}
                  </span>
                )}
              </div>
              {!publicView && e.note && (
                <p className="mt-2 text-xs italic text-muted-foreground">“{e.note}”</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
