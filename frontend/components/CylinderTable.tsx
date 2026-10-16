"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Cylinder, CylinderStatus } from "@/lib/types";
import { StatusChangeMenu } from "./StatusChangeMenu";

const STATUS_STYLES: Record<CylinderStatus, string> = {
  Empty: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Filled: "bg-blue-50 text-blue-700 ring-blue-600/10",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  InMaintenance: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Retired: "bg-red-50 text-red-700 ring-red-600/10",
};

const STATUS_DOT: Record<CylinderStatus, string> = {
  Empty: "bg-slate-400",
  Filled: "bg-blue-500",
  Delivered: "bg-emerald-500",
  InMaintenance: "bg-amber-500",
  Retired: "bg-red-500",
};

function StatusBadge({ status }: { status: CylinderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  );
}

export function CylinderTable({
  cylinders,
  statusChangingId,
  onChangeStatus,
}: {
  cylinders: Cylinder[];
  statusChangingId: number | null;
  onChangeStatus: (id: number, status: CylinderStatus, customerName?: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Serial Number
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gas Type
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last Updated
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cylinders.map((cylinder) => (
            <tr key={cylinder.id} className="group transition hover:bg-slate-50/70">
              <td className="max-w-[12rem] truncate px-5 py-3.5 font-mono text-[13px] text-slate-700">
                {cylinder.serialNumber}
              </td>
              <td className="px-5 py-3.5 text-slate-600">{cylinder.gasType}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={cylinder.status} />
              </td>
              <td
                className="max-w-[16rem] truncate px-5 py-3.5 text-slate-600"
                title={cylinder.customerName ?? undefined}
              >
                {cylinder.customerName ?? <span className="text-slate-300">&mdash;</span>}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">
                {new Date(cylinder.lastUpdated).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/cylinders/${cylinder.id}/edit`}
                    title="Edit cylinder"
                    aria-label={`Edit ${cylinder.serialNumber}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2.25} />
                  </Link>
                  <StatusChangeMenu
                    cylinder={cylinder}
                    submitting={statusChangingId === cylinder.id}
                    onChangeStatus={(status, customerName) =>
                      onChangeStatus(cylinder.id, status, customerName)
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
