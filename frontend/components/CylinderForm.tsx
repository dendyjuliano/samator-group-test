"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { cylinderFormSchema, CylinderFormValues } from "@/lib/validation";
import { GAS_TYPES } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";

export interface CylinderFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CylinderFormValues>;
  submitting: boolean;
  onSubmit: (values: CylinderFormValues) => void;
}

export function CylinderForm({ mode, defaultValues, submitting, onSubmit }: CylinderFormProps) {
  const [pendingValues, setPendingValues] = useState<CylinderFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CylinderFormValues>({
    resolver: zodResolver(cylinderFormSchema),
    defaultValues: {
      serialNumber: defaultValues?.serialNumber ?? "",
      gasType: defaultValues?.gasType ?? GAS_TYPES[0],
    },
  });

  return (
    <>
      <form
        onSubmit={handleSubmit((values) => setPendingValues(values))}
        className="flex max-w-md flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div>
          <label htmlFor="serialNumber" className="block text-sm font-medium text-slate-700">
            Serial Number
          </label>
          <input
            id="serialNumber"
            type="text"
            placeholder="CYL-123456"
            {...register("serialNumber")}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 placeholder:font-sans focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.serialNumber && (
            <p className="mt-1.5 text-sm text-red-600">{errors.serialNumber.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="gasType" className="block text-sm font-medium text-slate-700">
            Gas Type
          </label>
          <select
            id="gasType"
            {...register("gasType")}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {GAS_TYPES.map((gas) => (
              <option key={gas} value={gas}>
                {gas}
              </option>
            ))}
          </select>
          {errors.gasType && <p className="mt-1.5 text-sm text-red-600">{errors.gasType.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />}
          {mode === "create" ? "Create Cylinder" : "Save Changes"}
        </button>
      </form>

      <ConfirmDialog
        open={pendingValues !== null}
        title={mode === "create" ? "Create this cylinder?" : "Save these changes?"}
        description={
          pendingValues
            ? `Serial number: ${pendingValues.serialNumber.toUpperCase()}, Gas type: ${pendingValues.gasType}`
            : undefined
        }
        confirmLabel={mode === "create" ? "Create" : "Save"}
        busy={submitting}
        onConfirm={() => {
          if (pendingValues) onSubmit(pendingValues);
        }}
        onCancel={() => setPendingValues(null)}
      />
    </>
  );
}
