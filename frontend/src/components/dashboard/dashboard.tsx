// src/components/dashboard/dashboard.tsx
import React, { useState, useEffect } from "react";

import Taskbar from "../taskbar/Taskbar";
import RowActions from "../table/RowActions";
import ResultDetailsModal from "../modals/ResultDetailsModal";

import {
  getCompanyInfoReq,
  getReportFrameworkReq,
  getCategoriesReq,
  getMetricsReq,
  getMetricComputationMethodReq,
  getMetricValueReq,
  modelExecutionReq,
  generateReportReq,
} from "../../api/esg";

import type { CategoryKey, CalcRow } from "../../interface/interface";

import type {
  ModelExecResult,
  DirectValueResult,
  ModelExecMetricInfo,
} from "../modals/ResultDetailsModal";

import type { MetricMethod, ReportData, ReportItem, UploadItem } from "../../api/esg";
import { useNavigate } from "react-router-dom";

const YEARS = Array.from({ length: 12 }, (_, i) => `${2014 + i}`);

// --- Helper components ---
function Select({
  value,
  onChange,
  children,
  placeholder = "Select...",
  className = "",
  id,
  label,
}: React.PropsWithChildren<{
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  label?: string;
}>) {
  return (
    <div>
      {/* Accessible label for screen readers */}
      {label && id && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </div>
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
  const [framework, setFramework] = useState<string>(); // keep undefined by default
  const [category, setCategory] = useState<CategoryKey>();
  const [metric, setMetric] = useState<string>();
  const [year, setYear] = useState<string>();
  const [industry, setIndustry] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem("companyName") ?? ""); // CHANGED
  const [permId, setPermId] = useState<string>(() => localStorage.getItem("permId") ?? ""); // CHANGED
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
    setMetricMethodLoading((prev) => ({ ...prev, [metricLabel]: true }));
    try {
      const res = await getMetricComputationMethodReq(metricLabel);
      if (res.ok) {
        const method = res.data as MetricMethod;
        setMetricMethodByMetric((prev) => ({ ...prev, [metricLabel]: method }));

        if (method.measureMethod === "direct_measurement") {
          updateRow(cat, { model: "direct_measurement" });
        } else {
          const typ = method.hasCalculationType ?? "calculation_model";
          updateRow(cat, { model: typ });
        }
        setMetricMethodErr((prev) => ({ ...prev, [metricLabel]: null }));
      } else {
        setMetricMethodErr((prev) => ({ ...prev, [metricLabel]: res.message }));
        setMetricMethodByMetric((prev) => ({ ...prev, [metricLabel]: null }));
      }
    } finally {
      setMetricMethodLoading((prev) => ({ ...prev, [metricLabel]: false }));
    }
  }

  const modelDisplayFor = (metric?: string) => {
    if (!metric) return "";
    const m = metricMethodByMetric[metric];
    if (!m) return "";
    return m.measureMethod === "direct_measurement"
      ? "direct_measurement"
      : m.isCalculatedBy;
  };

  const ensureMethod = async (cat: CategoryKey, metricLabel: string): Promise<MetricMethod> => {
    let method = metricMethodByMetric[metricLabel];
    if (method) return method;

    const res = await getMetricComputationMethodReq(metricLabel);
    if (!res.ok) throw new Error(res.message);

    method = res.data;
    setMetricMethodByMetric((prev) => ({ ...prev, [metricLabel]: method }));

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
      .filter((r) => r.status === "Success" && r.metric && r.value !== undefined)
      .map((r) => {
        const metricLabel = r.metric!;
        const method = metricMethodByMetric[metricLabel];
        const payload = detailsByCategory[r.category];

        const base = {
          category: r.category,
          metric: metricLabel,
          modelDisplay: modelDisplayFor(metricLabel) || (r.model ?? ""),
          value: asNumberIfPossible(r.value!),
        };

        if (!method) {
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

    // Attach uploadItem persisted from upload flow (if any)
    let uploadItem: UploadItem | undefined = undefined;
    try {
      const raw = localStorage.getItem("uploadItem");
      if (raw) uploadItem = JSON.parse(raw) as UploadItem;
    } catch {
      // ignore parse errors
    }

    return {
      perm_id: permId, // CHANGED
      industry,
      framework,
      year: year!,
      items,
      uploadItem, // include upload info for report rendering
    };
  };

  async function handleGenerateReport(fileType: string = "pdf") {
    const data = buildReportData();
    if (!data) {
      alert("Nothing to export yet. Pick a year and calculate at least one metric successfully.");
      return;
    }

    const res = await generateReportReq(fileType, data);
    if (res.ok) {
      window.open(res.data.fileURL, "_blank", "noopener,noreferrer");
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!permId) { 
          // clear when empty
          setIndustry("");
          setCompanyName("");
          setIndustryErr(null);
          setFrameworks([]);
          return;
        }

        const ir = await getCompanyInfoReq(permId); // CHANGED
        if (!alive) return;

        if (!ir.ok) {
          setIndustry("");
          setCompanyName("");
          setIndustryErr(ir.message);
          setFrameworks([]);
          return;
        }

        const industryVal = ir.data.industry;
        setIndustry(industryVal);
        setCompanyName(ir.data.company_name ?? "");
        setIndustryErr(null);

        const fr = await getReportFrameworkReq(industryVal);
        if (!alive) return;

        if (fr.ok) {
          const list = fr.data.result ?? [];
          setFrameworks(list);
          setFwErr(null);
          // Keep existing framework if still valid; otherwise preselect if only one
          setFramework((prev) => (prev && list.includes(prev) ? prev : list.length === 1 ? list[0] : prev));
        } else {
          setFrameworks([]);
          setFwErr(fr.message);
        }
      } finally {
        // no-op
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permId]); // CHANGED

  useEffect(() => {
    setRows((prev) =>
      categories.map((c) => {
        const old = prev.find((r) => r.category === c);
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

    return () => {
      alive = false;
    };
  }, [industry, framework]);

  useEffect(() => {
    if (!industry || !framework || categories.length === 0) return;

    let alive = true;

    setMetricsLoading((prev) => {
      const next = { ...prev };
      for (const c of categories) next[c] = true;
      return next;
    });

    (async () => {
      const results = await Promise.all(
        categories.map(async (c) => {
          const res = await getMetricsReq(industry, c, framework);
          if (!alive) return { c, list: [], err: "cancelled" as string | null };
          if (res.ok) return { c, list: res.data.result ?? [], err: null };
          return { c, list: [], err: res.message };
        })
      );

      if (!alive) return;

      setMetricsByCategory((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.c] = r.list;
        return next;
      });
      setMetricsErr((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.c] = r.err;
        return next;
      });
      setMetricsLoading((prev) => {
        const next = { ...prev };
        for (const c of categories) next[c] = false;
        return next;
      });

      setRows((prev) =>
        prev.map((row) => {
          const list = metricsByCategory[row.category] ?? [];
          return list.includes(row.metric ?? "") ? row : { ...row, metric: undefined };
        })
      );
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, framework, categories]);

  useEffect(() => {
    setMetricsByCategory({});
    setMetricsErr({});
    setMetricsLoading({});
    setRows((prev) => prev.map((r) => ({ ...r, metric: undefined })));
  }, [framework]);

  const anyCalculated = rows.some((r) => r.status === "Success");

  function updateRow(category: CategoryKey, patch: Partial<CalcRow>) {
    setRows((rs) => rs.map((r) => (r.category === category ? { ...r, ...patch } : r)));
  }

  async function calculateRow(row: CalcRow) {
    if (!row.metric) return;
    if (!year) {
      updateRow(row.category, { status: "Failed", value: undefined });
      return;
    }

    updateRow(row.category, { status: "Calculating...", value: undefined });

    try {
      const method = await ensureMethod(row.category, row.metric);

      if (method.measureMethod === "direct_measurement") {
        const metricName = method.obtainedFrom ?? row.metric!;
        if (!method.obtainedFrom) {
          updateRow(row.category, { status: "Failed", value: undefined });
          return;
        }

        const res = await getMetricValueReq(permId, metricName, year); // CHANGED
        if (res.ok) {
          const raw = res.data as {
            value: number | string;
            pillar?: string;
            reported_date?: string;
          };

          const payload: DirectValueResult = {
            value: raw.value,
            pillar: raw.pillar,
            reported_date: raw.reported_date,
            source: method.source ?? null,
            obtainedFrom: method.obtainedFrom ?? null,
          };
          updateRow(row.category, { status: "Success", value: String(payload.value) });
          setDetailsByCategory((prev) => ({ ...prev, [row.category]: payload }));
        } else {
          updateRow(row.category, { status: "Failed" });
        }
        return;
      }
      // Calculation model path
      const calcType = method.hasCalculationType ?? "calculation_model";
      const inputs = method.requiresInputFrom ?? [];

      const exec = await modelExecutionReq(permId, calcType, year, inputs); // CHANGED
      if (exec.ok) {
        const raw = exec.data as {
          value: number | string;
          pillar?: string;
          implementation: string;
          metricInfo: ModelExecMetricInfo[];
        };
        const payload: ModelExecResult = {
          value: raw.value,
          implementation: raw.implementation,
          pillar: raw.pillar,
          metricInfo: raw.metricInfo,
          hasFormula: method.hasFormula ?? null,
        };
        const v = payload.value;
        updateRow(row.category, { status: "Success", value: String(v) });
        setDetailsByCategory((prev) => ({ ...prev, [row.category]: payload }));
      } else {
        updateRow(row.category, { status: "Failed" });
      }
    } catch {
      updateRow(row.category, { status: "Failed" });
    }
  }

  function resetAll() {
    setPermId("");
    setFramework(undefined);
    setCategory(undefined);
    setMetric(undefined);
    setYear(undefined);
    setRows([]);
    setCompanyName("");
    // Clear persisted values explicitly on reset
    localStorage.removeItem("permId");
    localStorage.removeItem("companyName");
    localStorage.removeItem("framework");
  }

  const navigate = useNavigate();

  // Persist to localStorage only when non-empty to avoid clearing on first mount
  useEffect(() => {
    if (permId) localStorage.setItem("permId", permId);
  }, [permId]);
  useEffect(() => {
    if (companyName) localStorage.setItem("companyName", companyName);
  }, [companyName]);
  useEffect(() => {
    if (framework) localStorage.setItem("framework", framework);
  }, [framework]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top taskbar */}
      <Taskbar
        brand="SAGE"
        subtitle="ESG Report"
        onUploadClick={() => navigate("/upload")}
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
                {/* Accessible label */}
                <label htmlFor="perm-id" className="sr-only">Perm ID</label>
                <input
                  id="perm-id"
                  value={permId}
                  onChange={(e) => setPermId(e.target.value)}
                  placeholder="Enter Perm ID"
                  className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                />
              </div>
              {/* Company Name field */}
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Company Name</div>
                {/* Accessible label */}
                <label htmlFor="company-name" className="sr-only">Company Name</label>
                <input
                  id="company-name"
                  value={companyName}
                  placeholder={companyName.length ? "Company Name" : "No Company Name"}
                  readOnly
                  className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Framework</div>
                <Select
                  id="framework-select"
                  label="Framework"
                  value={framework}
                  onChange={setFramework}
                  placeholder={
                    fwLoading
                      ? "Loading..."
                      : frameworks.length
                      ? "Select framework"
                      : "No frameworks"
                  }
                  className="w-full"
                >
                  {frameworks.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
                {fwErr && <div id="framework-error" className="text-xs text-red-600">{fwErr}</div>}
                {catLoading && <div className="text-xs text-slate-500">Loading categories…</div>}
                {catErr && <div id="category-error" className="text-xs text-red-600">{catErr}</div>}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Year</div>
                <Select id="year-select" label="Year" value={year} onChange={setYear} placeholder="Select year">
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Industry</div>
                {/* Accessible label */}
                <label htmlFor="industry" className="sr-only">Industry</label>
                <input
                  id="industry"
                  value={industry}
                  placeholder={industry.length ? "Select Industry" : "No Industry"}
                  readOnly
                  className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                />
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
          <div className="mb-2 text-xs text-right text-slate-500">Select at least one metric</div>

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
                    id={`metric-${r.category}`}
                    label={`Metric for ${r.category}`}
                    value={r.metric}
                    onChange={(v) => {
                      updateRow(r.category, { metric: v, model: undefined });
                      if (v) fetchMetricMethodForRow(r.category, v);
                    }}
                    placeholder={
                      metricsLoading[r.category]
                        ? "Loading metrics..."
                        : metricsFor(r.category).length
                        ? "Select metric"
                        : metricsErr[r.category]
                        ? `No metrics (${metricsErr[r.category]})`
                        : "No metrics"
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
                  {/* Accessible label */}
                  <label htmlFor={`model-${r.category}`} className="sr-only">
                    Model for {r.category}
                  </label>
                  <input
                    id={`model-${r.category}`}
                    value={modelDisplayFor(r.metric)}
                    readOnly
                    placeholder={
                      !r.metric
                        ? "Select a metric first"
                        : r.metric && metricMethodLoading[r.metric]
                        ? "Loading..."
                        : r.metric && metricMethodErr[r.metric]
                        ? `Error: ${metricMethodErr[r.metric]}`
                        : ""
                    }
                    className="w-full h-10 px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 text-sm"
                    aria-describedby={
                      r.metric && metricMethodErr[r.metric] ? `model-err-${r.category}` : undefined
                    }
                  />
                  {r.metric && metricMethodErr[r.metric] && (
                    <div id={`model-err-${r.category}`} className="text-xs text-red-600">
                      {metricMethodErr[r.metric]}
                    </div>
                  )}
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
                    <span className="ml-2 text-slate-700 font-medium">Result: {r.value}</span>
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
