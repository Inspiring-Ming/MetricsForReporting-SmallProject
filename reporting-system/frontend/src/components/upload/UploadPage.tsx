import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Taskbar from "../taskbar/Taskbar";
import CodeIDE from "../ide/CodeIDE";
import {
  getCompanyInfoReq, getReportFrameworkReq, 
  getCategoriesReq, getModelCalMetricsReq,
} from "../../api/esg";

export default function UploadPage() {
  const navigate = useNavigate();

  // Upload type: "metric" or "implementation"
  const [uploadType, setUploadType] = useState<"metric" | "implementation">("implementation");

  // --- Categories (fetched) ---
  const [categories, setCategories] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  // Removed mock metricsByCategory; metrics are fetched via API
  const [category, setCategory] = useState<string>("");
  const [metric, setMetric] = useState<string>("");

  // Fetched metrics
  const [metrics, setMetrics] = useState<string[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsErr, setMetricsErr] = useState<string | null>(null);

  // Mock input metrics list
  const availableInputs = [
    "Grid Electricity",
    "Total Energy",
    "Revenue",
    "Employees",
    "Electricity Usage",
    "Fuel Consumption",
    "Purchased Heat",
    "Distance Traveled",
  ];
  const [selectedInputs, setSelectedInputs] = useState<string[]>([]);

  const toggleInput = (name: string) => {
    setSelectedInputs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // New: model and implementation names
  const [modelName, setModelName] = useState<string>("");
  const [implementationName, setImplementationName] = useState<string>("");

  // Ensure the implementation name ends with ".py"
  const ensurePyExtension = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    return /\.py$/i.test(trimmed) ? trimmed : `${trimmed}.py`;
  };

  // View switching only for Implementation upload
  const [view, setView] = useState<"form" | "ide">("form");

  const handleGoToIDE = () => {
    // Auto-append .py if missing
    setImplementationName((prev) => ensurePyExtension(prev));
    setView("ide");
    // Bring the editor into focus view
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  // Company context similar to dashboard
  const [permId, setPermId] = useState<string>(() => localStorage.getItem("permId") ?? "");
  const [industry, setIndustry] = useState<string>("");
  const [framework, setFramework] = useState<string>(() => localStorage.getItem("framework") ?? "");
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [fwLoading, setFwLoading] = useState(false);
  const [fwErr, setFwErr] = useState<string | null>(null);

  // Persist to localStorage only when non-empty
  useEffect(() => { if (permId) localStorage.setItem("permId", permId); }, [permId]);
  useEffect(() => { if (framework) localStorage.setItem("framework", framework); }, [framework]);

  // Fetch company info and frameworks when permId changes (like dashboard)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!permId) {
        setIndustry("");
        setFrameworks([]);
        setFramework("");
        setFwErr(null);
        // reset categories when no permId
        setCategories([]);
        setCategory("");
        setMetric("");
        setCatErr(null);
        return;
      }
      const ir = await getCompanyInfoReq(permId);
      if (!alive) return;

      if (!ir.ok) {
        setIndustry("");
        setFrameworks([]);
        setFramework("");
        setFwErr(ir.message);
        return;
      }

      setIndustry(ir.data.industry ?? "");

      if (ir.data.industry) {
        setFwLoading(true);
        const fr = await getReportFrameworkReq(ir.data.industry);
        if (!alive) return;
        setFwLoading(false);

        if (fr.ok) {
          const list = fr.data.result ?? [];
          setFrameworks(list);
          setFwErr(null);
          setFramework((prev) => (prev && list.includes(prev) ? prev : list.length === 1 ? list[0] : ""));
        } else {
          setFrameworks([]);
          setFwErr(fr.message);
        }
      } else {
        setFrameworks([]);
        setFramework("");
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permId]);

  // Fetch categories whenever industry and framework are available
  useEffect(() => {
    let alive = true;
    (async () => {
      setCategory("");
      setMetric("");

      if (!industry || !framework) {
        setCategories([]);
        setCatErr(null);
        return;
      }

      setCatLoading(true);
      const cr = await getCategoriesReq(industry, framework);
      if (!alive) return;
      setCatLoading(false);

      if (cr.ok) {
        const list = cr.data.result ?? [];
        setCategories(list);
        setCatErr(null);
        // Auto-select single category
        if (list.length === 1) setCategory(list[0]);
      } else {
        setCategories([]);
        setCatErr(cr.message);
      }
    })();
    return () => { alive = false; };
  }, [industry, framework]);

  // Fetch metrics for selected category (model-calculable metrics)
  useEffect(() => {
    let alive = true;

    // Reset when category or context changes
    setMetric("");
    setMetrics([]);
    setMetricsErr(null);

    if (!industry || !framework || !category) return;

    setMetricsLoading(true);
    (async () => {
      const res = await getModelCalMetricsReq(industry, category, framework);
      if (!alive) return;
      setMetricsLoading(false);

      if (res.ok) {
        const list = res.data.result ?? [];
        setMetrics(list);
        setMetricsErr(null);
        if (list.length === 1) setMetric(list[0]);
      } else {
        setMetrics([]);
        setMetricsErr(res.message);
      }
    })();

    return () => { alive = false; };
  }, [industry, framework, category]);

  // Add a guard to ensure both names are provided
  const canProceed = Boolean(
    category &&
    metric &&
    permId &&
    (frameworks.length === 0 || framework) &&
    modelName.trim() &&
    implementationName.trim()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Taskbar brand="SAGE" subtitle="Upload" onUploadClick={() => {}} onProfileClick={() => {}} />
      <main
        className={`mx-auto ${view === "ide" ? "max-w-5xl" : "max-w-3xl"} p-4 md:p-6 lg:p-8`}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="px-5 py-3 border-b text-slate-700 font-semibold">Upload</div>

          <div className="p-5 space-y-6">
            {/* Upload type selector */}
            <div className="grid gap-2">
              <div className="text-xs text-slate-500">Upload type</div>
              <select
                value={uploadType}
                onChange={(e) => {
                  const next = e.target.value as "metric" | "implementation";
                  setUploadType(next);
                  // Reset IDE view when switching types
                  setView("form");
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm"
              >
                <option value="metric">Metric upload</option>
                <option value="implementation">Implementation upload</option>
              </select>
            </div>

            {uploadType === "metric" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Metric upload is not implemented yet. Please choose “Implementation upload” to proceed.
              </div>
            )}

            {uploadType === "implementation" && view === "form" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Perm ID</div>
                    <input
                      value={permId}
                      onChange={(e) => setPermId(e.target.value)}
                      placeholder="Enter Perm ID"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Industry</div>
                    <input
                      value={industry}
                      readOnly
                      placeholder={permId ? "Fetching..." : "Enter Perm ID first"}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-slate-100 shadow-sm text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Framework</div>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      disabled={!frameworks.length}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm disabled:bg-slate-100"
                    >
                      <option value="" disabled>
                        {fwLoading ? "Loading..." : frameworks.length ? "Select framework" : "Enter Perm ID first"}
                      </option>
                      {frameworks.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    {fwErr && <div className="text-xs text-red-600">{fwErr}</div>}
                  </div>
                </div>

                {!permId && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Enter a Perm ID to fetch Industry and available Frameworks.
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Category selectors */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs text-slate-500">Category</div>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setMetric("");
                      }}
                      disabled={!framework || fwLoading || catLoading || !categories.length}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm disabled:bg-slate-100"
                    >
                      <option value="" disabled>
                        {!framework
                          ? "Select framework first"
                          : catLoading
                            ? "Loading..."
                            : categories.length
                              ? "Select category"
                              : "No categories available"}
                      </option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {catErr && <div className="text-xs text-red-600">{catErr}</div>}
                  </div>
                  
                  {/* Metric selectors */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs text-slate-500">Metric</div>
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      disabled={!category || metricsLoading || !metrics.length}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm disabled:bg-slate-100"
                    >
                      <option value="" disabled>
                        {!category
                          ? "Select a category first"
                          : metricsLoading
                            ? "Loading..."
                            : metrics.length
                              ? "Select metric"
                              : "No metrics available"}
                      </option>
                      {metrics.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {metricsErr && <div className="text-xs text-red-600">{metricsErr}</div>}
                  </div>
                </div>

                {/* New: Model name and Implementation name */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Model name</div>
                    <input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      required
                      placeholder="e.g. Percentage Ratio"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Implementation name (.py)</div>
                    <input
                      value={implementationName}
                      onChange={(e) => setImplementationName(e.target.value)}
                      onBlur={() => setImplementationName((prev) => ensurePyExtension(prev))}
                      required
                      placeholder="e.g. percentage_ratio.py"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm"
                    />
                    {!/\.py$/i.test(implementationName.trim()) && implementationName.trim().length > 0 && (
                      <div className="text-[11px] text-slate-500">
                        Tip: We will append “.py” automatically.
                      </div>
                    )}
                  </div>
                </div>

                {/* Input metrics multi-select (checkboxes) */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">Input metrics (mock)</div>
                  <div className="rounded-xl border p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableInputs.map((name) => (
                      <label key={name} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedInputs.includes(name)}
                          onChange={() => toggleInput(name)}
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">
                    Selected: {selectedInputs.length ? selectedInputs.join(", ") : "None"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow hover:bg-indigo-500 disabled:opacity-50"
                    disabled={!canProceed}
                    onClick={handleGoToIDE}
                    title={!canProceed ? "Fill in all required fields" : "Proceed to IDE"}
                  >
                    Next
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl border text-sm hover:bg-slate-50"
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}

            {uploadType === "implementation" && view === "ide" && (
              <>
                {/* Show context summary in IDE view */}
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div><span className="font-medium">Perm ID:</span> {permId || "—"}</div>

                  <div><span className="font-medium">Industry:</span> {industry || "—"}</div>
                  <div><span className="font-medium">Framework:</span> {framework || "—"}</div>
                </div>
                <CodeIDE
                  category={category}
                  metric={metric}
                  inputs={selectedInputs}
                  // New props
                  modelName={modelName}
                  implementationName={implementationName}
                  onBack={() => setView("form")}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
