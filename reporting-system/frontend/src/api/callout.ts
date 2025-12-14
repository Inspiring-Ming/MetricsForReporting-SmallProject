import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { emitApiError } from "../components/error/errorBus";

// If using proxy, leave baseURL as "" and call relative paths.
// If not, set VITE_API_URL in .env (e.g., http://localhost:3000).
const baseURL = import.meta.env.VITE_API_URL ?? "";

// Axios instance so we can add headers/interceptors in one place.
const http = axios.create({
  baseURL,
  // withCredentials: true, // uncomment if you use cookies
  headers: { "Content-Type": "application/json" },
});

// --- Result type (no `any`) ---------------------------------------------------
export type Ok<T>  = { ok: true;  data: T };
export type Err    = { ok: false; statusCode: number; message: string };
export type Result<T> = Ok<T> | Err;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// shape server error payloads
type ApiErrorPayload = { error?: unknown; message?: string; success?: boolean };
type ApiErrorBody = { error: string; message?: string };

function isApiErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === "object" &&
         v !== null &&
         typeof (v as Record<string, unknown>).error === "string";
}

// Extract a meaningful error message from various payload shapes
function extractMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return undefined;

  const o = data as any;
  // common shapes: { message }, { error: string }, { error: { message } }, { success:false, error:{ message } }
  if (typeof o.message === "string") return o.message;
  if (typeof o.error === "string") return o.error;
  if (o.error && typeof o.error.message === "string") return o.error.message;
  return undefined;
}

export async function requestHelper<T>(
  method: HttpMethod,
  url: string,
  payload?: Record<string, unknown>,
  token?: string,
): Promise<Result<T>> {
  const config: AxiosRequestConfig = {
    method,
    url,
    params: method === "GET" || method === "DELETE" ? payload : undefined,
    data:   method === "POST" || method === "PUT" || method === "PATCH" ? payload : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };

  try {
    const res = await http.request<T>(config);

    // ✅ No 'any' usage; check for server-declared error in a 2xx body
    const dataUnknown: unknown = res.data;
    if (isApiErrorBody(dataUnknown)) {
      const msg = dataUnknown.message ?? dataUnknown.error;
      emitApiError?.({ statusCode: res.status, message: msg });
      return { ok: false, statusCode: res.status, message: msg };
    }

    // Also handle KG-style success:false envelopes returned with 2xx
    if (
      typeof dataUnknown === "object" &&
      dataUnknown !== null &&
      (dataUnknown as any).success === false
    ) {
      const msg = extractMessage(dataUnknown) ?? "Request failed";
      emitApiError?.({ statusCode: res.status, message: msg });
      return { ok: false, statusCode: res.status, message: msg };
    }

    return { ok: true, data: res.data as T };
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 500;
      const data = e.response?.data as ApiErrorPayload | string | undefined;
      const msg =
        extractMessage(data) ??
        e.message ??
        "Internal Error";
      emitApiError?.({ statusCode: status, message: msg }); // 🔔 POPUP
      return { ok: false, statusCode: status, message: msg };
    }
    emitApiError?.({ statusCode: 500, message: "Internal Error" });
    return { ok: false, statusCode: 500, message: "Internal Error" };
  }
}
