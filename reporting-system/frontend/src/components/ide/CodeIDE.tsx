import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  validateCodeReq, submitCodeReq, executeCodeReq,
  uploadModelReq, uploadImplementationReq
} from "../../api/esg";
import { updateMetricCalMethodReq } from "../../api/esg";

type Props = {
  category: string;
  metric: string;
  inputs: string[];
  onBack: () => void;
  language?: "python";
  // New
  modelName?: string;
  implementationName?: string; // expect "<name>.py"
};

function generatePythonTemplate(
  category: string,
  metric: string,
  inputs: string[],
  modelName?: string,
  implementationName?: string
) {
  return [
    "# Python Implementation Editor",
    "# Rules for compatibility:",
    "# - Read inputs from sys.argv (1-based), matching the number of selected inputs.",
    "# - Compute and print a single JSON line as the final output: {\"result\": <value>}.",
    "# - You may print debug lines before, but the last printed line must be the JSON.",
    "",
    `category = ${JSON.stringify(category)}`,
    `metric = ${JSON.stringify(metric)}`,
    `input_names = ${JSON.stringify(inputs)}`,
    // New metadata
    `model_name = ${JSON.stringify(modelName ?? "")}`,
    `implementation_name = ${JSON.stringify(implementationName ?? "")}`,
    "",
    "import sys, json, math",
    "",
    "def parse_args(names):",
    "    vals = []",
    "    for i, _ in enumerate(names, start=1):",
    "        try:",
    "            vals.append(float(sys.argv[i]))  # 1-based indexing for args",
    "        except:",
    "            # Fallback if missing/invalid arg; adjust as needed",
    "            vals.append(0.0)",
    "    return vals",
    "",
    "def compute(args):",
    "    # TODO: implement your logic here",
    "    # Example: percentage ratio with divide-by-zero guard",
    "    if len(args) >= 2 and args[1] != 0:",
    "        return (args[0] / args[1]) * 100.0",
    "    return None",
    "",
    "args = parse_args(input_names)",
    "print('category:', category)",
    "print('metric:', metric)",
    "print('model_name:', model_name)",
    "print('implementation_name:', implementation_name)",
    "print('input_names:', input_names)",
    "print('args:', args)",
    "result = compute(args)",
    "",
    "# IMPORTANT: this must be the last printed line for the platform to parse the result",
    "print(json.dumps({\"result\": result}))",
    "",
  ].join("\n");
}

export default function CodeIDE({
  category,
  metric,
  inputs,
  onBack,
  language = "python",
  // New
  modelName,
  implementationName,
}: Props) {
  const [code, setCode] = useState<string>(() =>
    language === "python"
      ? generatePythonTemplate(category, metric, inputs, modelName, implementationName)
      : ""
  );

  // --- fullscreen handling ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFsNative, setIsFsNative] = useState(false);
  const [isFsCss, setIsFsCss] = useState(false);
  const isFullscreen = isFsNative || isFsCss;

  useEffect(() => {
    const onFsChange = () => setIsFsNative(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterFullscreen = async () => {
    const el = containerRef.current;
    if (el && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        // fall back to CSS fullscreen
      }
    }
    setIsFsCss(true);
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    setIsFsCss(false);
  };

  // Focus editor after entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const t = window.setTimeout(() => {
        containerRef.current?.querySelector<HTMLDivElement>(".cm-content")?.focus();
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [isFullscreen]);

  // --- actions state ---
  const [isRunning, setIsRunning] = useState(false);
  const [validation, setValidation] = useState<
    { status: "idle" | "ok" | "error"; error?: { message: string; line?: number; column?: number; text?: string } }
  >({ status: "idle" });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [execOutput, setExecOutput] = useState<unknown>(null);
  const [execErr, setExecErr] = useState<string | null>(null);

  // --- terminal ---
  const [termOpen, setTermOpen] = useState<boolean>(false);
  const [execLogs, setExecLogs] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (termOpen) termRef.current?.scrollTo({ top: termRef.current.scrollHeight });
  }, [execLogs, termOpen]);

  const checkSyntax = async () => {
    setIsRunning(true);
    setValidation({ status: "idle" });
    try {
      const res = await validateCodeReq("python", code);
      if (!res.ok) {
        setValidation({ status: "error", error: { message: res.message } });
        return;
      }
      if (res.data.ok) setValidation({ status: "ok" });
      else setValidation({ status: "error", error: res.data.error });
    } catch (e: any) {
      setValidation({ status: "error", error: { message: e.message } });
    } finally {
      setIsRunning(false);
    }
  };

  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [modelUploadMsg, setModelUploadMsg] = useState<string | null>(null);
  const [implUploadMsg, setImplUploadMsg] = useState<string | null>(null);
  const [linkMsg, setLinkMsg] = useState<string | null>(null); // new: metric-model link status
  // Track uploaded model URI for visualization
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [persistMsg, setPersistMsg] = useState<string | null>(null); // new: saved to report

  const submitScript = async () => {
    setIsSubmitting(true);
    setSubmitErr(null);
    setSavedId(null);
    setSavedFilePath(null);
    setModelUploadMsg(null);
    setImplUploadMsg(null);
    setLinkMsg(null);
    setModelUri(null);
    setPersistMsg(null);
    try {
      const res = await submitCodeReq("python", code, implementationName);
      if (!res.ok) return setSubmitErr(res.message);
      if (!res.data.ok || !res.data.id) return setSubmitErr(res.data.error?.message || "Failed to submit script");
      setSavedId(res.data.id);
      if (res.data.file?.path) setSavedFilePath(res.data.file.path);

      // Upload implementation first; only proceed to model on success
      let implOk = false;
      let implUri: string | null = null; // capture IRI for implementation
      let implPath: string | null = null;
      if (implementationName) {
        const baseImpl = implementationName.replace(/\.py$/i, "");
        implPath = `models/user_scripts/${baseImpl}.py`;
        const implRes = await uploadImplementationReq(baseImpl, "Python", implPath);
        if (implRes.ok) {
          implOk = true;
          implUri = (implRes.data as any)?.iri || null;
          const iri = implUri || baseImpl;
          setImplUploadMsg(`Implementation uploaded with IRI: ${iri}`);
        } else {
          const msg = typeof implRes.message === "string" ? implRes.message : JSON.stringify(implRes.message);
          setImplUploadMsg(`Implementation upload failed: ${msg}`);
        }
      } else {
        setImplUploadMsg("Implementation upload skipped: missing implementation name.");
      }

      // Only upload model if implementation upload succeeded
      let modelOk = false;
      let modelIriLocal: string | null = null;
      let calculation_type: string | undefined = undefined;
      if (implOk && modelName && implementationName) {
        const baseImpl = implementationName.replace(/\.py$/i, "");
        calculation_type = `user_scripts/${baseImpl}`;
        const kgRes = await uploadModelReq(modelName, calculation_type, inputs, baseImpl);
        if (kgRes.ok) {
          modelOk = true;
          modelIriLocal = (kgRes.data as any)?.iri || modelName;
          setModelUploadMsg(`Model uploaded with IRI: ${modelIriLocal}`);
          setModelUri(modelIriLocal); // save for visualization
        } else {
          const msg = typeof kgRes.message === "string" ? kgRes.message : JSON.stringify(kgRes.message);
          setModelUploadMsg(`Model upload failed: ${msg}`);
        }
      } else if (modelName && implementationName) {
        setModelUploadMsg("Model upload skipped: implementation upload did not succeed.");
      } else {
        setModelUploadMsg("Model upload skipped: missing model or implementation name.");
      }

      // Link metric to model only if model upload succeeded
      let linkInfo: { metric_label: string; model_label: string; updated_at?: string } | undefined = undefined;
      if (modelOk && modelName && metric) {
        const linkRes = await updateMetricCalMethodReq(metric, modelName);
        if (linkRes.ok) {
          const linkedMetric = linkRes.data.metric_label || metric;
          const linkedModel = linkRes.data.model?.label || modelName;
          linkInfo = {
            metric_label: linkedMetric,
            model_label: linkedModel,
            updated_at: linkRes.data.updated_at,
          };
          setLinkMsg(`Linked metric '${linkedMetric}' to model '${linkedModel}'.`);
        } else {
          const msg = typeof linkRes.message === "string" ? linkRes.message : JSON.stringify(linkRes.message);
          setLinkMsg(`Link metric to model failed: ${msg}`);
        }
      }

      // Persist upload info for report only if we have model success
      // if (modelOk && modelName) {
      //   const uploadItem = {
      //     category,
      //     metric,
      //     modelName,
      //     implementationName: implementationName!, // includes .py
      //     // implementationFilePath: savedFilePath || implPath || undefined,
      //     implementationUri: implUri || undefined,
      //     modelUri: modelIriLocal || undefined,
      //     inputMetrics: inputs,
      //     calculationType: calculation_type,
      //     link: linkInfo,
      //     notes: "Note: Execution values for the uploaded model may use mock/random inputs for demonstration.",
      //     created_at: new Date().toISOString(),
      //   };
      //   try {
      //     localStorage.setItem("uploadItem", JSON.stringify(uploadItem));
      //     setPersistMsg("Upload info saved for report.");
      //   } catch {
      //     // ignore storage errors
      //   }
      // }
    } catch (e: any) {
      setSubmitErr(e.message || "Failed to submit script");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open GraphDB visualization with the uploaded model URI
  const openGraphVisualization = () => {
    if (!modelUri) return;
    const url = `http://localhost:7200/graphs-visualizations?uri=${encodeURIComponent(modelUri)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const executeScript = async () => {
    if (!savedId && !implementationName) return;
    setIsExecuting(true);
    setExecErr(null);
    setExecOutput(null);
    setTermOpen(true);
    setExecLogs((prev) => [...prev, "> Executing script..."]);
    try {
      const res = await executeCodeReq(savedId || undefined, inputs, implementationName);
      if (!res.ok) {
        setExecErr(res.message);
        setExecLogs((prev) => [...prev, `! ERROR: ${res.message}`]);
        return;
      }
      const logs = Array.isArray(res.data.logs) ? res.data.logs : [];
      if (res.data.ok) {
        setExecOutput(res.data.result);
        setExecLogs([
          ...logs,
          `> Result: ${typeof res.data.result === "object"
            ? JSON.stringify(res.data.result)
            : String(res.data.result)
          }`,
        ]);
      } else {
        const msg = res.data.error?.message || "Execution failed";
        setExecErr(msg);
        setExecLogs([...logs, `! ERROR: ${msg}`]);
      }
    } catch (e: any) {
      const msg = e?.message || "Execution failed";
      setExecErr(msg);
      setExecLogs((prev) => [...prev, `! ERROR: ${msg}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearTerminal = () => {
    setExecLogs([]);
    setExecErr(null);
    setExecOutput(null);
  };

  const editorHeight = isFullscreen ? "100vh" : "420px";

  return (
    <div ref={containerRef} className={isFsCss ? "fixed inset-0 z-50 bg-white overflow-hidden" : ""}>
      {isFullscreen ? (
        // Fullscreen: editor only + overlay exit button
        <div className="relative h-screen">
          <button
            className="absolute top-3 right-3 z-50 p-2 rounded-lg border bg-white/90 hover:bg-white shadow pointer-events-auto"
            onClick={exitFullscreen}
            aria-label="Exit Full Screen"
            title="Exit Full Screen"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* inward corners icon */}
              <path d="M9 4H4v5" />
              <path d="M15 4h5v5" />
              <path d="M4 15v5h5" />
              <path d="M20 15v5h-5" />
            </svg>
          </button>
          <CodeMirror
            value={code}
            height="100vh"
            theme={oneDark}
            extensions={[python()]}
            basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: true, autocompletion: true }}
            autoFocus
            onChange={(value) => setCode(value)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* header with fullscreen button */}
          <div className="flex items-center justify-between text-sm text-slate-700">
            <div>
              <div className="font-medium">Python IDE</div>
              <div className="text-xs text-slate-500">Prefilled with your selections.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg border hover:bg-slate-50"
                onClick={enterFullscreen}
                aria-label="Enter Full Screen"
                title="Full Screen"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* outward corners icon */}
                  <path d="M4 9V4h5" />
                  <path d="M20 9V4h-5" />
                  <path d="M4 15v5h5" />
                  <path d="M20 15v5h-5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Category</div>
              <div className="font-medium">{category}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Metric</div>
              <div className="font-medium">{metric}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Inputs</div>
              <div className="font-medium">{inputs.length ? inputs.join(", ") : "None"}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Model name</div>
              <div className="font-medium">{modelName || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Implementation (.py)</div>
              <div className="font-medium">{implementationName || "—"}</div>
            </div>
          </div>
          {/* Editor */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Code (Python)</div>
            <div className="rounded-xl border border-slate-300 overflow-hidden">
              <CodeMirror
                value={code}
                height={editorHeight}
                theme={oneDark}
                extensions={[python()]}
                basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: true, autocompletion: true }}
                autoFocus
                onChange={(value) => setCode(value)}
              />
            </div>
            {validation.status === "ok" && <div className="mt-2 text-xs text-green-600">Syntax OK</div>}
            {validation.status === "error" && (
              <div className="mt-2 text-xs text-red-600">
                {validation.error?.message || "Validation error"}
                {validation.error?.line ? ` at line ${validation.error.line}` : ""}
                {validation.error?.column ? `, col ${validation.error.column}` : ""}
              </div>
            )}
            {savedId && (
              <div className="mt-2 text-xs text-slate-700">
                Saved id: <span className="font-mono">{savedId}</span>
              </div>
            )}
            {modelUploadMsg && (
              <div className="mt-1 text-xs text-slate-700">{modelUploadMsg}</div>
            )}
            {implUploadMsg && (
              <div className="mt-1 text-xs text-slate-700">{implUploadMsg}</div>
            )}
            {linkMsg && (
              <div className="mt-1 text-xs text-slate-700">{linkMsg}</div>
            )}
            {persistMsg && (
              <div className="mt-1 text-xs text-slate-700">{persistMsg}</div>
            )}
            {submitErr && <div className="mt-2 text-xs text-red-600">{submitErr}</div>}
          </div>

          {/* Terminal panel */}
          <div className="rounded-xl border">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-sm font-medium">Terminal</div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-2 py-1 rounded border hover:bg-slate-50" onClick={() => setTermOpen((v) => !v)}>
                  {termOpen ? "Hide" : "Show"}
                </button>
                <button className="text-xs px-2 py-1 rounded border hover:bg-slate-50" onClick={clearTerminal}>
                  Clear
                </button>
              </div>
            </div>
            {termOpen && (
              <div ref={termRef} className="bg-black text-green-200 text-xs font-mono px-3 py-2 rounded-b-xl h-48 overflow-auto">
                {execLogs.length === 0 ? <div className="opacity-60">No output yet.</div> : execLogs.map((ln, i) => <div key={i}>{ln}</div>)}
                {execErr && <div className="text-red-400">! ERROR: {execErr}</div>}
                {execOutput !== null && !execErr && (
                  <div className="text-green-400">
                    Result: {typeof execOutput === "object" ? JSON.stringify(execOutput) : String(execOutput)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl border text-sm hover:bg-slate-50" onClick={() => { if (isFullscreen) exitFullscreen(); onBack(); }}>
              Back to Configuration
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-50" onClick={checkSyntax} disabled={isRunning || isSubmitting || isExecuting}>
              {isRunning ? "Checking..." : "Check Syntax"}
            </button>
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-50" onClick={submitScript} disabled={isSubmitting || isRunning || isExecuting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50"
              onClick={executeScript}
              disabled={!savedId || isExecuting || isSubmitting || isRunning}
              title={!savedId ? "Submit the script first" : "Execute saved script"}
            >
              {isExecuting ? "Executing..." : "Execute"}
            </button>
            {/* New: Graph Visualization button */}
            <button
              className="px-4 py-2 rounded-xl bg-indigo-700 text-white text-sm hover:bg-indigo-600 disabled:opacity-50"
              onClick={openGraphVisualization}
              disabled={!modelUri}
              title={!modelUri ? "Upload implementation and model successfully first" : "Open Graph Visualization"}
            >
              Graph Visualization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
