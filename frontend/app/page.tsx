"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApiError, changeCylinderStatus, listCylinders } from "@/lib/api";
import { Cylinder, CylinderStatus, PagedResult } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { StatusFilter } from "@/components/StatusFilter";
import { StatusSummary } from "@/components/StatusSummary";
import { Pagination } from "@/components/Pagination";
import { CylinderTable } from "@/components/CylinderTable";
import { LoadingState, EmptyState, ErrorState } from "@/components/StateMessage";
import { ErrorModal } from "@/components/ErrorModal";

const PAGE_SIZE = 10;

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PagedResult<Cylinder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 whenever the active filters change. Adjusting state while
  // rendering (rather than in a separate effect) avoids an extra render pass.
  const [appliedFilters, setAppliedFilters] = useState({ search: debouncedSearch, status });
  if (appliedFilters.search !== debouncedSearch || appliedFilters.status !== status) {
    setAppliedFilters({ search: debouncedSearch, status });
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/deps-change pattern (react.dev "Fetching Data")
    setLoading(true);
    setLoadError(null);

    listCylinders({ search: debouncedSearch, status, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, page, reloadToken]);

  async function handleChangeStatus(id: number, newStatus: CylinderStatus, customerName?: string) {
    setStatusChangingId(id);
    try {
      await changeCylinderStatus(id, { status: newStatus, customerName });
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err as ApiError);
    } finally {
      setStatusChangingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cylinders</h2>
          <p className="text-sm text-slate-500">Search, filter, and manage every tracked cylinder.</p>
        </div>
        {result && (
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-600">{result.totalCount}</span> total
            {status && <> &middot; filtered by <span className="font-medium text-slate-600">{status}</span></>}
          </p>
        )}
      </div>

      <StatusSummary reloadToken={reloadToken} />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <StatusFilter value={status} onChange={setStatus} />
        </div>
        <Link
          href="/cylinders/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Cylinder
        </Link>
      </div>

      {loading && <LoadingState label="Loading cylinders..." />}

      {!loading && loadError && (
        <ErrorState message={loadError} onRetry={() => setReloadToken((t) => t + 1)} />
      )}

      {!loading && !loadError && result && result.items.length === 0 && <EmptyState />}

      {!loading && !loadError && result && result.items.length > 0 && (
        <>
          <CylinderTable
            cylinders={result.items}
            statusChangingId={statusChangingId}
            onChangeStatus={handleChangeStatus}
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            totalCount={result.totalCount}
            onPageChange={setPage}
          />
        </>
      )}

      {actionError && <ErrorModal error={actionError} onClose={() => setActionError(null)} />}
    </div>
  );
}
