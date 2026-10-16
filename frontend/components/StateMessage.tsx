import { AlertTriangle, Inbox, Loader2, RotateCcw } from "lucide-react";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Shell>
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" strokeWidth={2.25} />
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </Shell>
  );
}

export function EmptyState({
  title = "No cylinders found",
  description = "Try adjusting your search or filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Shell>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </Shell>
  );
}

export function ErrorState({
  message = "Something went wrong while loading data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Shell>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="max-w-sm text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Try again
        </button>
      )}
    </Shell>
  );
}
