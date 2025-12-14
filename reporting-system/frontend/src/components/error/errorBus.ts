export type ApiError = { statusCode: number; message: string };

let listeners: Array<(e: ApiError) => void> = [];

export function emitApiError(error: ApiError) {
  for (const l of listeners) l(error);
}

export function subscribeApiError(listener: (e: ApiError) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
