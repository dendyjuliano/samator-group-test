"use client";

import { useEffect, useState } from "react";
import { Box, CheckCircle2, PackageCheck, Truck, Wrench } from "lucide-react";
import { listCylinders } from "@/lib/api";
import { CYLINDER_STATUSES, CylinderStatus } from "@/lib/types";

const ICONS: Record<CylinderStatus, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Empty: Box,
  Filled: PackageCheck,
  Delivered: Truck,
  InMaintenance: Wrench,
  Retired: CheckCircle2,
};

const ACCENTS: Record<CylinderStatus, string> = {
  Empty: "bg-slate-100 text-slate-600",
  Filled: "bg-blue-50 text-blue-600",
  Delivered: "bg-emerald-50 text-emerald-600",
  InMaintenance: "bg-amber-50 text-amber-600",
  Retired: "bg-red-50 text-red-600",
};

export function StatusSummary({ reloadToken }: { reloadToken: number }) {
  const [counts, setCounts] = useState<Partial<Record<CylinderStatus, number>>>({});

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      CYLINDER_STATUSES.map((status) =>
        listCylinders({ status, page: 1, pageSize: 1 })
          .then((res) => [status, res.totalCount] as const)
          .catch(() => [status, undefined] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setCounts(Object.fromEntries(entries.filter(([, count]) => count !== undefined)));
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {CYLINDER_STATUSES.map((status) => {
        const Icon = ICONS[status];
        const count = counts[status];
        return (
          <div
            key={status}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENTS[status]}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">{status}</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {count ?? <span className="text-slate-300">&middot;&middot;&middot;</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
