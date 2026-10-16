"use client";

import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api";

export function ErrorModal({ error, onClose }: { error: ApiError; onClose: () => void }) {
  const fieldMessages = Object.entries(error.fieldErrors).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`)
  );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Request error"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-overlay-in"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 animate-dialog-in">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Request failed</h2>
            <p className="mt-1 text-sm text-slate-500">{error.message}</p>
          </div>
        </div>
        {fieldMessages.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {fieldMessages.map((msg) => (
              <li key={msg} className="list-inside list-disc">
                {msg}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
