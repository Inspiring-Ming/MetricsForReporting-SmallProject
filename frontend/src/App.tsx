import React, { useMemo, useState, useEffect  } from "react";
import Taskbar from "./components/taskbar/Taskbar";
import RowActions from "./components/table/RowActions";
import ResultDetailsModal from "./components/modals/ResultDetailsModal";
import { 
  getCompanyIndustryReq, getReportFrameworkReq,
  getCategoriesReq, getMetricsReq,
  getMetricComputationMethodReq,
  getMetricValueReq, modelExecutionReq,
  generateReportReq,
} from "./api/esg";

import type { 
  CategoryKey, CalcRow,
} from "./interface/interface";


import type {
  ModelExecResult,
  DirectValueResult,
  ModelExecMetricInfo,
} from "./components/modals/ResultDetailsModal";

import type { MetricMethod, ReportData, ReportItem } from "./api/esg";

// --- Mock data (swap these with real API data) ---
// Mock data of DXC Technology Co - Semiconductors
const perm_id = "5054883975";

// Sogn Sparebank - Commercial Banks
// const perm_id = "4295885677";

const YEARS = Array.from({ length: 12 }, (_, i) => `${2014 + i}`);

// --- Helper components ---
function Select({
  value,
  onChange,
  children,
  placeholder = "Select...",
  className = "",
}: React.PropsWithChildren<{
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}>) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {children}
    </select>
  );
}

function SectionCard({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="px-5 py-3 border-b text-slate-700 font-semibold">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const asNumberIfPossible = (v: string | number): number | string => {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};

// --- Main Component ---
export default function ESGDashboard() {
  // Global filters
  const [framework, setFramework] = useState<string>();
  const [category, setCategory] = useState<CategoryKey>();
  const [metric, setMetric] = useState<string>();
  const [year, setYear] = useState<string>();
  const [industry, setIndustry] = useState<string>("");
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [rows, setRows] = useState<CalcRow[]>([]);
  const [metricsByCategory, setMetricsByCategory] = useState<Record<string, string[]>>({});
  const [metricMethodByMetric, setMetricMethodByMetric] = 
    useState<Record<string, MetricMethod | null>>({});

  // modal state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCat, setDetailsCat] = useState<string | null>(null);
  const [detailsMetric, setDetailsMetric] = useState<string | undefined>(undefined);
  
  // store the full latest response payload per category
  const [detailsByCategory, setDetailsByCategory] = useState<
    Record<string, ModelExecResult | DirectValueResult | null>
  >({});
  
  
  // Loading State
  const [catLoading, setCatLoading] = useState(false);
  const [fwLoading, setFwLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState<Record<string, boolean>>({});
  const [metricMethodLoading, setMetricMethodLoading] =
    useState<Record<string, boolean>>({});
  
  // Error state
  const [fwErr, setFwErr] = useState<string | null>(null);
  const [industryErr, setIndustryErr] = useState<string | null>(null);
  const [catErr, setCatErr] = useState<string | null>(null);
  const [metricsErr, setMetricsErr] = useState<Record<string, string | null>>({});
  const [metricMethodErr, setMetricMethodErr] =
    useState<Record<string, string | null>>({});

  const metricsFor = (cat: string) => metricsByCategory[cat] ?? [];

  async function fetchMetricMethodForRow(cat: CategoryKey, metricLabel: string) {
    setMetricMethodLoading(prev => ({ ...prev, [metricLabel]: true }));
    try {
      const res = await getMetricComputationMethodReq(metricLabel);
      if (res.ok) {
        const method = res.data as MetricMethod;
        // store full payload for later calculations
        setMetricMethodByMetric(prev => ({ ...prev, [metricLabel]: method }));

        // set the row.model to something useful for later compute
        if (method.measureMethod === "direct_measurement") {
          updateRow(cat, { model: "direct_measurement" });
        } else {
          // prefer the explicit calculation type if provided
          const typ = method.hasCalculationType ?? "calculation_model";
          updateRow(cat, { model: typ });
        }
        // clear any previous error
        setMetricMethodErr(prev => ({ ...prev, [metricLabel]: null }));
      } else {
        setMetricMethodErr(prev => ({ ...prev, [metricLabel]: res.message }));
        setMetricMethodByMetric(prev => ({ ...prev, [metricLabel]: null }));
      }
    } finally {
      setMetricMethodLoading(prev => ({ ...prev, [metricLabel]: false }));
    }
  }

  const modelDisplayFor = (metric?: string) => {
    if (!metric) return "";
    const m = metricMethodByMetric[metric];
    if (!m) return "";
    return m.measureMethod === "direct_measurement"
      ? "direct_measurement"
      : m.isCalculatedBy; // e.g., "Grid Electricity Rate Model"
  };

  const ensureMethod = async (cat: CategoryKey, metricLabel: string): Promise<MetricMethod> => {
    let method = metricMethodByMetric[metricLabel];
    if (method) return method;

    const res = await getMetricComputationMethodReq(metricLabel);
    if (!res.ok) throw new Error(res.message);

    method = res.data;
    // store for later
    setMetricMethodByMetric(prev => ({ ...prev, [metricLabel]: method }));

    // also keep the model field in sync
    if (method.measureMethod === "direct_measurement") {
      updateRow(cat, { model: "direct_measurement" });
    } else {
      updateRow(cat, { model: method.hasCalculationType ?? "calculation_model" });
    }
    return method;
  };

  const buildReportData = (): ReportData | null => {
    if (!year || !industry) return null;

    const items: ReportItem[] = rows
      .filter(r => r.status === "Success" && r.metric && r.value !== undefined)
      .map(r => {
        const metricLabel = r.metric!;
        const method = metricMethodByMetric[metricLabel];
        const payload = detailsByCategory[r.category]; // DirectValueResult | ModelExecResult | null

        const base = {
          category: r.category,
          metric: metricLabel,
          modelDisplay: modelDisplayFor(metricLabel) || (r.model ?? ""),
          value: asNumberIfPossible(r.value!),
        };

        if (!method) {
          // Shouldn’t happen because we fetch it when a metric is picked,
          // but keep a safe fallback.
          return {
            ...base,
            method: "direct_measurement",
            methodDetails: { direct: {} },
          } as ReportItem;
        }

        if (method.measureMethod === "direct_measurement") {
          const direct = payload as DirectValueResult | null;
          return {
            ...base,
            method: "direct_measurement",
            methodDetails: {
              direct: {
                obtainedFrom: method.obtainedFrom ?? null,
                source: method.source ?? null,
                reported_date: direct?.reported_date ?? null,
                pillar: (direct as any)?.pillar ?? null,
              },
            },
          } as ReportItem;
        }

        // calculation_model
        const calc = payload as ModelExecResult | null;
        return {
          ...base,
          method: "calculation_model",
          methodDetails: {
            calc: {
              calculationType: method.hasCalculationType ?? null,
              modelExecution: calc?.implementation ?? null,
              formula: method.hasFormula,
              inputs: method.requiresInputFrom ?? [],
              metricInfo: calc?.metricInfo ?? [],
              pillar: (calc as any)?.pillar ?? null,
            },
          },
        } as ReportItem;
      });

    if (items.length === 0) return null;

    return {
      perm_id,
      industry,
      framework,
      year: year!,
      items,
    };
  };

  async function handleGenerateReport(fileType: string = "pdf") {
    const data = buildReportData();
    if (!data) {
      // Your error bus will show a popup via requestHelper if you like,
      // but here we can short-circuit with a friendly message:
      // (If you have emitApiError available here, you can call it.)
      alert("Nothing to export yet. Pick a year and calculate at least one metric successfully.");
      return;
    }

    const res = await generateReportReq(fileType, data );
    if (res.ok) {
      // open the generated file (or you can show a toast with res.data.fileName)
      window.open(res.data.fileURL, "_blank", "noopener,noreferrer");
    } else {
      // requestHelper already called emitApiError; nothing else required.
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      // optional: setFwLoading(true) if you track loading
      try {
        // 1) get industry
        const ir = await getCompanyIndustryReq(perm_id);
        if (!alive) return;

        if (!ir.ok) {
          setIndustry("");
          setIndustryErr(ir.message);
          setFrameworks([]);
          return;
        }

        const industryVal = ir.data.result;
        setIndustry(industryVal);
        setIndustryErr(null);

        // 2) get frameworks for that industry
        const fr = await getReportFrameworkReq(industryVal);
        if (!alive) return;

        if (fr.ok) {
          const list = fr.data.result ?? [];
          setFrameworks(list);
          setFwErr(null);

          // Autoselect if nothing chosen yet and only one option
          setFramework(prev =>
            prev ?? (list.length === 1 ? list[0] : prev)
          );
        } else {
          setFrameworks([]);
          setFwErr(fr.message);
        }
      } finally {
        // optional: setFwLoading(false)
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perm_id]);

  useEffect(() => {
    setRows(prev =>
      categories.map((c) => {
        const old = prev.find(r => r.category === c);
        return old ?? { category: c, status: "Not calculated" };
      })
    );
  }, [categories]);

  useEffect(() => {
    if (!industry || !framework) return;
    let alive = true;

    (async () => {
      try {
        setCatLoading(true);
        const res = await getCategoriesReq(industry, framework);
        if (!alive) return;

        if (res.ok) {
          // API shape: { result: string[] }
          setCategories((res.data.result ?? []) as unknown as CategoryKey[]);
          setCatErr(null);
        } else {
          setCategories([]);
          setCatErr(res.message);
        }
      } finally {
        if (alive) setCatLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [industry, framework]);

  useEffect(() => {
    if (!industry || !framework || categories.length === 0) return;

    let alive = true;

    // mark all current categories as loading
    setMetricsLoading(prev => {
      const next = { ...prev };
      for (const c of categories) next[c] = true;
      return next;
    });

    (async () => {
      // fetch all categories in parallel
      const results = await Promise.all(
        categories.map(async (c) => {
          const res = await getMetricsReq(industry, c, framework);
          if (!alive) return { c, list: [], err: "cancelled" as string | null };
          if (res.ok)  return { c, list: res.data.result ?? [], err: null };
          return { c, list: [], err: res.message };
        })
      );

      if (!alive) return;

      // write results
      setMetricsByCategory(prev => {
        const next = { ...prev };
        for (const r of results) next[r.c] = r.list;
        return next;
      });
      setMetricsErr(prev => {
        const next = { ...prev };
        for (const r of results) next[r.c] = r.err;
        return next;
      });
      setMetricsLoading(prev => {
        const next = { ...prev };
        for (const c of categories) next[c] = false;
        return next;
      });

      // optional: clear any metric selections that are no longer valid
      setRows(prev =>
        prev.map(row => {
          const list = (metricsByCategory[row.category] ?? []); // previous tick
          return list.includes(row.metric ?? "") ? row : { ...row, metric: undefined };
        })
      );
    })();

    // cleanup
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, framework, categories]);

  useEffect(() => {
    // clear metrics map whenever framework changes
    setMetricsByCategory({});
    setMetricsErr({});
    setMetricsLoading({});
    // also clear selected metrics on all rows
    setRows(prev => prev.map(r => ({ ...r, metric: undefined })));
  }, [framework]);


  const anyCalculated = rows.some((r) => r.status === "Success");

  function updateRow(category: CategoryKey, patch: Partial<CalcRow>) {
    setRows((rs) =>
      rs.map((r) => (r.category === category ? { ...r, ...patch } : r))
    );
  }

  async function calculateRow(row: CalcRow) {
    // require metric + year
    if (!row.metric) return;
    if (!year) {
      updateRow(row.category, { status: "Failed", value: undefined });
      return;
    }

    updateRow(row.category, { status: "Calculating...", value: undefined });

    try {
      // 1) make sure we know how this metric is computed
      const method = await ensureMethod(row.category, row.metric);

      // 2) branch by method type
      if (method.measureMethod === "direct_measurement") {
        // Use the backend key from the method, not the UI label
        const metricName = method.obtainedFrom ?? row.metric!;

        if (!method.obtainedFrom) {
          updateRow(row.category, { status: "Failed", value: undefined });
          // optionally toast / error: "Missing 'obtainedFrom' for direct_measurement"
          return;
        }
    
        // GET a stored value
        const res = await getMetricValueReq(perm_id, metricName, year);
        if (res.ok) {
          const raw = res.data as { value: number | string; pillar?: string; reported_date?: string };
          // const payload: DirectValueResult = res.data as any;

          // enrich with method info so the modal can display it
          const payload: DirectValueResult = {
            value: raw.value,
            pillar: raw.pillar,
            reported_date: raw.reported_date,
            source: method.source ?? null,            // ← from getMetricComputationMethodReq
            obtainedFrom: method.obtainedFrom ?? null // ← from getMetricComputationMethodReq
          };
          updateRow(row.category, { status: "Success", value: String(payload.value) });

          setDetailsByCategory(prev => ({ ...prev, [row.category]: payload }));
        } else {
          updateRow(row.category, { status: "Failed" });
        }
        return;
      }

      // calculation_model: gather inputs and POST execute
      const calcType = method.hasCalculationType ?? "calculation_model";
      const inputs = method.requiresInputFrom ?? [];

      const exec = await modelExecutionReq(perm_id, calcType, year, inputs);
      if (exec.ok) {
        const raw = exec.data as { 
          value: number | string; 
          pillar?: string; 
          implementation: string; 
          metricInfo: ModelExecMetricInfo[];
        };
        // const payload: ModelExecResult = exec.data as any;
        const payload: ModelExecResult = {
            value: raw.value,
            implementation: raw.implementation,
            pillar: raw.pillar,
            metricInfo: raw.metricInfo,
            hasFormula: method.hasFormula ?? null, // ← from getMetricComputationMethodReq
          };
        const v = payload.value;
        updateRow(row.category, { status: "Success", value: String(v) });
        setDetailsByCategory(prev => ({ ...prev, [row.category]: payload }));
      } else {
        updateRow(row.category, { status: "Failed" });
      }
    } catch (e) {
      updateRow(row.category, { status: "Failed" });
    }
  }

  function resetAll() {
    setFramework(undefined);
    setCategory(undefined);
    setMetric(undefined);
    setYear(undefined);
    setRows([]);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top taskbar */}
      <Taskbar
        brand="SAGE"
        subtitle="ESG Report"
        // onChatBotClick={() => console.log("chatbot")}
        onProfileClick={() => console.log("profile")}
      />

      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        {/* Intro card */}
        <SectionCard title="Generate a PDF report of your preferred ESG report">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3 text-slate-600">
              <p>Choose metrics and models. Download the generated PDF for your records.</p>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>Metrics Value: Selected metrics such as Carbon Emission Scope 1, 2, 3</li>
                <li>Current Reporting Framework, Metrics, and Model in each category</li>
                <li>Time series analysis for popular metrics</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Perm ID</div>
                <input
                  value={ perm_id }
                  readOnly
                  className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Industry</div>
                <input
                  value={industry} 
                  placeholder={industry.length ? "Select Industry" : "No Industry"}
                  readOnly
                  className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500">Framework</div>
                <Select
                  value={framework}
                  onChange={setFramework}
                  placeholder={fwLoading ? "Loading..." : (frameworks.length ? "Select framework" : "No frameworks")}
                  className="w-full"
                >
                  {frameworks.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
                {fwErr && <div className="text-xs text-red-600">{fwErr}</div>}
                {catLoading && <div className="text-xs text-slate-500">Loading categories…</div>}
                {catErr && <div className="text-xs text-red-600">{catErr}</div>}
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500">Year</div>
                <Select value={year} onChange={setYear} placeholder="Select year">
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!anyCalculated || !year}
              onClick={() => handleGenerateReport("pdf")}
            >
              Generate ESG Report
            </button>
            <button
              className="px-4 py-2 rounded-xl border text-sm hover:bg-slate-50"
              onClick={resetAll}
            >
              Reset
            </button>
          </div>
        </SectionCard>

        {/* Calculator table */}
        <div className="mt-6">
          <div className="mb-2 text-xs text-right text-slate-500">
            Select at least one metric
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            {/* Header */}
            <div className="grid grid-cols-12 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
              <div className="col-span-3">Category</div>
              <div className="col-span-5">Metric</div>
              <div className="col-span-2">Model</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            {rows.map((r) => (
              <div
                key={r.category}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-t bg-white"
              >
                {/* Category */}
                <div className="col-span-3 text-sm truncate">{r.category}</div>

                {/* Metric */}
                <div className="col-span-5">
                  <Select
                    value={r.metric}
                    onChange={(v) => {
                      updateRow(r.category, { metric: v, model: undefined }); // clear old model
                      if (v) fetchMetricMethodForRow(r.category, v);
                    }}
                    placeholder={
                      metricsLoading[r.category] ? "Loading metrics..." :
                      metricsFor(r.category).length ? "Select metric" :
                      (metricsErr[r.category] ? `No metrics (${metricsErr[r.category]})` : "No metrics")
                    }
                    className="w-full"
                  >
                    {metricsFor(r.category).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Model */}
                <div className="col-span-2">
                  <input
                    value={modelDisplayFor(r.metric)}
                    readOnly
                    placeholder={
                      !r.metric
                        ? "Select a metric first"
                        : (r.metric && metricMethodLoading[r.metric]
                            ? "Loading..."
                            : (r.metric && metricMethodErr[r.metric]
                                ? `Error: ${metricMethodErr[r.metric]}`
                                : ""))
                    }
                    className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="col-span-2">
                  <RowActions
                    canCalculate={!!r.metric && !!year}
                    onCalculate={() => calculateRow(r)}
                    canShowDetails={r.status === "Success" && !!detailsByCategory[r.category]}
                    onShowDetails={() => {
                      setDetailsCat(r.category);
                      setDetailsMetric(r.metric);
                      setDetailsOpen(true);
                    }}
                    calculating={r.status === "Calculating..."}
                  />
                </div>

                {/* Status row */}
                <div className="col-span-12 text-right text-xs text-slate-500">
                  {r.status}
                  {r.value && r.status === "Success" && (
                    <span className="ml-2 text-slate-700 font-medium">
                      Result: {r.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        <ResultDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          category={detailsCat ?? ""}
          metric={detailsMetric}
          methodDisplay={modelDisplayFor(detailsMetric)}
          payload={detailsCat ? detailsByCategory[detailsCat] : null}
        />

        {/* Company info toggle */}
        <div className="mt-6 text-sm text-slate-600">
          <label className="inline-flex items-start gap-2">
            <input type="checkbox" className="mt-1 rounded" />
            <span>
              <span className="font-medium">Show your company information</span>
              <div className="text-xs text-slate-500">
                When this box is selected, your company information will appear in the ESG Report.
              </div>
            </span>
          </label>
        </div>
      </main>
    </div>
  );
}
