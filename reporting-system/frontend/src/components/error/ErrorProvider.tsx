import React, { useEffect, useState } from "react";
import { subscribeApiError, type ApiError } from "./errorBus";

export default function ErrorProvider({ children }: React.PropsWithChildren) {
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const unsub = subscribeApiError((e) => setError(e));
    return () => unsub();
  }, []);

  return (
    <>
      {children}
      {/* Modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setError(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold text-slate-800">Request failed</div>
            <div className="mt-2 text-sm text-slate-600">
              <div><span className="font-medium">Status:</span> {error.statusCode}</div>
              <div className="mt-1 break-words">
                <span className="font-medium">Message:</span> {error.message}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setError(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
