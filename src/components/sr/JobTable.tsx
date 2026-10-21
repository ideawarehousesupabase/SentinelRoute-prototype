import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobStatusBadge, VerificationBadge, EmptyState } from "./primitives";
import { useDemo } from "@/state/demo-store";
import type { CustodyJob } from "@/lib/types";

export function JobTable({ jobs }: { jobs: CustodyJob[] }) {
  const { driverById } = useDemo();
  if (!jobs.length)
    return (
      <EmptyState title="No custody jobs match" body="Adjust the filters or create a new job." />
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Item Type</TableHead>
            <TableHead>Assigned Driver</TableHead>
            <TableHead>Smart-Seal</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((j) => (
            <TableRow key={j.id}>
              <TableCell className="font-mono text-xs font-medium">{j.reference}</TableCell>
              <TableCell className="whitespace-nowrap">{j.itemCategory}</TableCell>
              <TableCell className="whitespace-nowrap">
                {driverById(j.driverId)?.name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{j.sealId ?? "—"}</TableCell>
              <TableCell className="max-w-44 truncate" title={j.collection.label}>
                {j.collection.label}
              </TableCell>
              <TableCell className="max-w-44 truncate" title={j.delivery.label}>
                {j.delivery.label}
              </TableCell>
              <TableCell>
                <JobStatusBadge status={j.status} />
              </TableCell>
              <TableCell>
                <VerificationBadge status={j.verification} />
              </TableCell>
              <TableCell>
                <Link
                  to="/partner/jobs/$jobId"
                  params={{ jobId: j.id }}
                  className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-medium text-primary hover:underline"
                >
                  View <ChevronRight className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
