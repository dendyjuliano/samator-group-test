import {
  ChangeStatusRequest,
  CreateCylinderRequest,
  Cylinder,
  PagedResult,
  UpdateCylinderRequest,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5199";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const fieldErrors: Record<string, string[]> = data?.errors ?? {};
    const message = data?.title ?? data?.message ?? `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message, fieldErrors);
  }

  return data as T;
}

export interface ListCylindersParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function listCylinders(params: ListCylindersParams): Promise<PagedResult<Cylinder>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  return request<PagedResult<Cylinder>>(`/api/cylinders?${query.toString()}`);
}

export function getCylinder(id: number): Promise<Cylinder> {
  return request<Cylinder>(`/api/cylinders/${id}`);
}

export function createCylinder(body: CreateCylinderRequest): Promise<Cylinder> {
  return request<Cylinder>("/api/cylinders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCylinder(id: number, body: UpdateCylinderRequest): Promise<Cylinder> {
  return request<Cylinder>(`/api/cylinders/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function changeCylinderStatus(id: number, body: ChangeStatusRequest): Promise<Cylinder> {
  return request<Cylinder>(`/api/cylinders/${id}/status`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
