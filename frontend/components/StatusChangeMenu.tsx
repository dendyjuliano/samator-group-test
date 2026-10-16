"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, RefreshCcw } from "lucide-react";
import { Cylinder, CylinderStatus } from "@/lib/types";
import { nextStatuses } from "@/lib/statusTransitions";
import { customerNameSchema } from "@/lib/validation";
import { ConfirmDialog } from "./ConfirmDialog";

export interface StatusChangeMenuProps {
  cylinder: Cylinder;
  submitting: boolean;
  onChangeStatus: (status: CylinderStatus, customerName?: string) => void;
}

export function StatusChangeMenu({ cylinder, submitting, onChangeStatus }: StatusChangeMenuProps) {
  const options = nextStatuses(cylinder.status);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CylinderStatus | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (options.length === 0) {
    return <span className="text-xs text-slate-400">No further transitions</span>;
  }

  function pickStatus(status: CylinderStatus) {
    setSelected(status);
    setCustomerError(null);
    if (status !== "Delivered") {
      setOpen(false);
      setSelected(status);
      setConfirming(true);
    }
  }

  function handleDeliveredSubmit() {
    const result = customerNameSchema.safeParse(customerName);
    if (!result.success) {
      setCustomerError(result.error.issues[0]?.message ?? "Invalid customer name.");
      return;
    }
    setCustomerError(null);
    setOpen(false);
    setConfirming(true);
  }

  function handleConfirm() {
    if (!selected) return;
    onChangeStatus(selected, selected === "Delivered" ? customerName.trim() : undefined);
    setConfirming(false);
    setSelected(null);
    setCustomerName("");
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={submitting}
        aria-label={`Change status for ${cylinder.serialNumber}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
        ) : (
          <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        Status
        <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={2.25} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 animate-dialog-in">
          {selected === "Delivered" ? (
            <div className="p-2">
              <label className="text-xs font-medium text-slate-500" htmlFor={`customer-${cylinder.id}`}>
                Customer name
              </label>
              <input
                id={`customer-${cylinder.id}`}
                type="text"
                autoFocus
                placeholder="e.g. PT Maju Jaya Abadi"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {customerError && <p className="mt-1 text-xs text-red-600">{customerError}</p>}
              <div className="mt-2 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDeliveredSubmit}
                  className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col">
              {options.map((status) => (
                <li key={status}>
                  <button
                    type="button"
                    onClick={() => pickStatus(status)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {status}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Change status to ${selected}?`}
        description={
          selected === "Delivered"
            ? `Cylinder ${cylinder.serialNumber} will be marked Delivered to "${customerName.trim()}".`
            : `Cylinder ${cylinder.serialNumber} will move from ${cylinder.status} to ${selected}.`
        }
        confirmLabel="Change Status"
        busy={submitting}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirming(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
