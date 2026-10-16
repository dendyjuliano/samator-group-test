"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError, createCylinder } from "@/lib/api";
import { CylinderFormValues } from "@/lib/validation";
import { CylinderForm } from "@/components/CylinderForm";
import { ErrorModal } from "@/components/ErrorModal";

export default function NewCylinderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(values: CylinderFormValues) {
    setSubmitting(true);
    try {
      await createCylinder(values);
      router.push("/");
    } catch (err) {
      setError(err as ApiError);
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">New Cylinder</h2>
        <p className="text-sm text-slate-500">New cylinders always start out Empty, with no customer.</p>
      </div>
      <CylinderForm mode="create" submitting={submitting} onSubmit={handleSubmit} />
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
}
