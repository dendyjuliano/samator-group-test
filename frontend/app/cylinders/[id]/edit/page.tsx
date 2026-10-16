"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError, getCylinder, updateCylinder } from "@/lib/api";
import { Cylinder } from "@/lib/types";
import { CylinderFormValues } from "@/lib/validation";
import { CylinderForm } from "@/components/CylinderForm";
import { ErrorModal } from "@/components/ErrorModal";
import { LoadingState, ErrorState } from "@/components/StateMessage";

export default function EditCylinderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const idIsValid = Number.isFinite(id);

  const [cylinder, setCylinder] = useState<Cylinder | null>(null);
  const [loading, setLoading] = useState(idIsValid);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!idIsValid) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern (react.dev "Fetching Data")
    setLoading(true);
    getCylinder(id)
      .then((data) => {
        if (!cancelled) setCylinder(data);
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setLoadError(err.status === 404 ? "Cylinder not found." : err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, idIsValid]);

  async function handleSubmit(values: CylinderFormValues) {
    setSubmitting(true);
    try {
      await updateCylinder(id, values);
      router.push("/");
    } catch (err) {
      setSubmitError(err as ApiError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Back to list
        </Link>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Edit Cylinder{cylinder ? ` · ${cylinder.serialNumber}` : ""}
        </h2>
        <p className="text-sm text-slate-500">Status changes happen from the list page, not here.</p>
      </div>

      {!idIsValid && <ErrorState message="Invalid cylinder id." />}
      {idIsValid && loading && <LoadingState label="Loading cylinder..." />}
      {idIsValid && !loading && loadError && <ErrorState message={loadError} />}

      {!loading && !loadError && cylinder && (
        <CylinderForm
          mode="edit"
          defaultValues={{ serialNumber: cylinder.serialNumber, gasType: cylinder.gasType as CylinderFormValues["gasType"] }}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}

      {submitError && <ErrorModal error={submitError} onClose={() => setSubmitError(null)} />}
    </div>
  );
}
