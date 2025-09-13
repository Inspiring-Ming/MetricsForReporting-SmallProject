// src/components/modals/ResultDetailsModal.tsx
import React from "react";

export type ModelExecMetricInfo = {
  metric_name: string;
  value: number | string;
  metric_type?: string;
  unit?: string;
  description?: string;
  provider?: string;
  source?: string;
};

export type ModelExecResult = {
  value: number | string;
  implementation: string; // e.g., "percentage_ratio.py"
  pillar?: string;
  hasFormula?: string | null;
  metricInfo: ModelExecMetricInfo[];
};

export type DirectValueResult = {
  value: number | string;
  pillar?: string;
  reported_date?: string;
  source?: string | null;        // ← NEW
  obtainedFrom?: string | null;  // ← NEW
};

type Props = {
  open: boolean;
  onClose: () => void;
  category: string;
  metric?: string;
  methodDisplay?: string; // the label you show in the table (direct_measurement or model name)
  payload?: ModelExecResult | DirectValueResult | null;
};

function isModelExec(v: unknown): v is ModelExecResult {
  return !!v && typeof v === "object" && "metricInfo" in (v as any);
}

export default function ResultDetailsModal({
  open,
  onClose,
  category,
  metric,
  methodDisplay,
  payload,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* sheet */}
      <div className="absolute inset-x-0 top-12 mx-auto w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <div className="font-semibold text-slate-800">
              Details — {category}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="p-5 space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">Metric</div>
                <div className="font-medium">{metric ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Model Name</div>
                <div className="font-medium">{methodDisplay ?? "-"}</div>
              </div>
            </div>

            {!payload && (
              <div className="text-slate-500">No details available.</div>
            )}

            {payload && isModelExec(payload) && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Result value</div>
                    <div className="font-medium">{String(payload.value)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Implementation</div>
                    <div className="font-medium">{payload.implementation}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pillar</div>
                    <div className="font-medium">{payload.pillar ?? "-"}</div>
                  </div>

                  {/* Formula: full width, single line with horizontal scroll */}
                    <div className="col-span-3">
                      <div className="text-xs text-slate-500 mb-1">Formula</div>
                      <div className="font-mono text-sm whitespace-nowrap overflow-x-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        {payload.hasFormula ?? "-"}
                      </div>
                    </div>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-slate-500 mb-2">
                    Inputs used (metricInfo)
                  </div>
                  <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left px-3 py-2">Metric name</th>
                          <th className="text-left px-3 py-2">Value</th>
                          <th className="text-left px-3 py-2">Unit</th>
                          <th className="text-left px-3 py-2">Provider</th>
                          <th className="text-left px-3 py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payload.metricInfo.map((mi, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{mi.metric_name}</td>
                            <td className="px-3 py-2">{String(mi.value)}</td>
                            <td className="px-3 py-2">{mi.unit ?? "-"}</td>
                            <td className="px-3 py-2">{mi.provider ?? "-"}</td>
                            <td className="px-3 py-2">{mi.source ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {payload && !isModelExec(payload) && (() => {
              const p = payload as DirectValueResult;
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Result value</div>
                    <div className="font-medium">{String(p.value)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pillar</div>
                    <div className="font-medium">{p.pillar ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Reported date</div>
                    <div className="font-medium">{p.reported_date ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Obtained from</div>
                    <div className="font-medium">{p.obtainedFrom ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Source</div>
                    <div className="font-medium">{p.source ?? "-"}</div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}
