import { z } from "zod";
import { GAS_TYPES } from "./types";

export const cylinderFormSchema = z.object({
  serialNumber: z
    .string()
    .trim()
    .min(1, "Serial number is required.")
    .regex(
      /^cyl-\d{6}$/i,
      "Serial number must match the format CYL-XXXXXX (6 digits)."
    ),
  gasType: z.enum(GAS_TYPES, {
    error: "Select a valid gas type.",
  }),
});
export type CylinderFormValues = z.infer<typeof cylinderFormSchema>;

export const customerNameSchema = z
  .string()
  .trim()
  .min(1, "Customer name is required when delivering a cylinder.")
  .max(120, "Customer name must be at most 120 characters.");
