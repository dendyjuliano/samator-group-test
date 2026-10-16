import { CylinderStatus } from "./types";

// Mirrors the transition rules enforced server-side in
// backend/src/Samator.CylinderTracker.Api/Domain/CylinderStatuses.cs.
// Kept here only so the UI can hide invalid choices up front; the server
// is still the source of truth and re-validates every change.
const TRANSITIONS: Record<CylinderStatus, CylinderStatus[]> = {
  Empty: ["Filled", "InMaintenance", "Retired"],
  Filled: ["Delivered", "InMaintenance", "Retired"],
  Delivered: ["Empty"],
  InMaintenance: ["Empty", "Retired"],
  Retired: [],
};

export function nextStatuses(current: CylinderStatus): CylinderStatus[] {
  return TRANSITIONS[current] ?? [];
}
