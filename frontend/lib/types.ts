export const GAS_TYPES = [
  "Oxygen",
  "Nitrogen",
  "Argon",
  "Carbon Dioxide",
  "Acetylene",
  "Hydrogen",
] as const;
export type GasType = (typeof GAS_TYPES)[number];

export const CYLINDER_STATUSES = [
  "Empty",
  "Filled",
  "Delivered",
  "InMaintenance",
  "Retired",
] as const;
export type CylinderStatus = (typeof CYLINDER_STATUSES)[number];

export interface Cylinder {
  id: number;
  serialNumber: string;
  gasType: string;
  status: CylinderStatus;
  customerName: string | null;
  lastUpdated: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateCylinderRequest {
  serialNumber: string;
  gasType: string;
}

export interface UpdateCylinderRequest {
  serialNumber: string;
  gasType: string;
}

export interface ChangeStatusRequest {
  status: CylinderStatus;
  customerName?: string | null;
}
