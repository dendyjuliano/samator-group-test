"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { CYLINDER_STATUSES } from "@/lib/types";

export function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <SlidersHorizontal
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        strokeWidth={2.25}
      />
      <select
        aria-label="Filter by status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All statuses</option>
        {CYLINDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        strokeWidth={2.25}
      />
    </div>
  );
}
