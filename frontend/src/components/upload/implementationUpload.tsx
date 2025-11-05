import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Taskbar from "../taskbar/Taskbar";
import CodeIDE from "../ide/CodeIDE";
import { getCompanyInfoReq, getReportFrameworkReq } from "../../api/esg";

export default function ImplementationUpload() {
  const navigate = useNavigate();

  // Upload type: "metric" or "implementation"
  const [uploadType, setUploadType] = useState<"metric" | "implementation">("implementation");

  // Mock data for implementation upload
  const categories = ["Emissions", "Energy", "Water", "Waste"];
  const metricsByCategory: Record<string, string[]> = {
    Emissions: ["Scope 1 Emissions", "Scope 2 Emissions", "Scope 3 Emissions"],
    Energy: ["Total Energy Consumption", "Renewable Energy Share", "Grid Intensity"],
    Water: ["Water Withdrawal", "Water Discharge"],
    Waste: ["Hazardous Waste", "Recycled Waste"],
  };
  const [category, setCategory] = useState<string>("");
  const [metric, setMetric] = useState<string>("");

  // Mock input metrics list
  const availableInputs = [
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

  // View switching only for Implementation upload
  const [view, setView] = useState<"form" | "ide">("form");

  const handleGoToIDE = () => {
    setView("ide");
    // Bring the editor into focus view
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const metricsForCategory = category ? metricsByCategory[category] ?? [] : [];

  // Company context similar to dashboard
  const [permId, setPermId] = useState<string>(() => localStorage.getItem("permId") ?? ""); // CHANGED
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem("companyName") ?? ""); // CHANGED
  const [industry, setIndustry] = useState<string>("");
  const [framework, setFramework] = useState<string>(() => localStorage.getItem("framework") ?? ""); // CHANGED
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [fwLoading, setFwLoading] = useState(false);
  const [fwErr, setFwErr] = useState<string | null>(null);

  // Persist to localStorage only when non-empty
  useEffect(() => { if (permId) localStorage.setItem("permId", permId); }, [permId]);
  useEffect(() => { if (companyName) localStorage.setItem("companyName", companyName); }, [companyName]);
  useEffect(() => { if (framework) localStorage.setItem("framework", framework); }, [framework]);

  // Fetch company info and frameworks when permId changes (like dashboard)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!permId) {
        setCompanyName("");
        setIndustry("");
        setFrameworks([]);
        setFramework("");
        setFwErr(null);
        return;
      }
      const ir = await getCompanyInfoReq(permId);
      if (!alive) return;

      if (!ir.ok) {
        setCompanyName("");
        setIndustry("");
        setFrameworks([]);
        setFramework("");
        setFwErr(ir.message);
        return;
      }

      if (!companyName) setCompanyName(ir.data.company_name ?? "");
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
                    <div className="text-xs text-slate-500">Company Name</div>
                    <input
                      value={companyName}
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
                    Enter a Perm ID to fetch Company Name and available Frameworks.
                  </div>
                )}

                {/* Category and Metric selectors */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Category</div>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setMetric("");
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Metric</div>
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      disabled={!category}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white shadow-sm text-sm disabled:bg-slate-100"
                    >
                      <option value="" disabled>
                        {category ? "Select metric" : "Select a category first"}
                      </option>
                      {metricsForCategory.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
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
                    disabled={
                      !category ||
                      !metric ||
                      !permId ||
                      (frameworks.length > 0 && !framework)
                    }
                    onClick={handleGoToIDE}
                  >
                    Upload
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
                  <div><span className="font-medium">Company Name:</span> {companyName || "—"}</div>
                  <div><span className="font-medium">Framework:</span> {framework || "—"}</div>
                </div>
                <CodeIDE
                  category={category}
                  metric={metric}
                  inputs={selectedInputs}
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
