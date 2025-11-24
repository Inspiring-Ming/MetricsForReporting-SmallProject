import fs from "fs";
import path from "path";
import crypto from "crypto";
import HTTPError from "http-errors";
import { PythonShell } from "python-shell";
import { ValidatePythonScriptResponse } from "../interface/interface";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sanitizeFilename(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "";
  // keep only safe chars, collapse spaces to underscore
  const base = trimmed.replace(/[/\\:*?"<>|]+/g, "").replace(/\s+/g, "_");
  // strip any directory parts
  const just = path.basename(base);
  // ensure .py
  return just.toLowerCase().endsWith(".py") ? just : `${just}.py`;
}

/**
 * Safely validate python code syntax without executing it.
 * Limits payload size and returns structured JSON.
 * Allows either sys.argv to receive data.
 */
async function validatePythonCode(source: string, language: string): Promise<ValidatePythonScriptResponse> {
  if (language !== "python") throw HTTPError(400, "Unsupported language");
  if (typeof source !== "string") throw HTTPError(400, "Invalid 'code' payload");

  const MAX_CODE_BYTES = 100 * 1024; // 100KB
  if (Buffer.byteLength(source, "utf8") > MAX_CODE_BYTES) {
    throw HTTPError(413, "Code too large");
  }

  const snippet = `
import sys, base64, json, io, re, ast

b64 = sys.argv[1] if len(sys.argv) > 1 else ""
try:
    src = base64.b64decode(b64).decode("utf-8", "replace")
except Exception:
    print(json.dumps({"ok": False, "error": {"message": "Invalid payload"}}))
    raise SystemExit(0)

# Align policy with runner:
ALLOWED_IMPORTS = {"sys", "math", "json"}
BANNED_CALLS = {"eval", "exec", "__import__", "open"}

uses_argv = False
uses_input = False

try:
    tree = ast.parse(src, filename="<user-code>", mode="exec")

    for node in ast.walk(tree):
        # Enforce allowed imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = (alias.name or "").split(".")[0]
                if root not in ALLOWED_IMPORTS:
                    print(json.dumps({"ok": False, "error": {"message": f"Disallowed import: {alias.name}", "line": node.lineno}}))
                    raise SystemExit(0)

        if isinstance(node, ast.ImportFrom):
            base = node.module or ""
            root = base.split(".")[0] if base else ""
            if root not in ALLOWED_IMPORTS:
                print(json.dumps({"ok": False, "error": {"message": f"Disallowed import: {base}", "line": node.lineno}}))
                raise SystemExit(0)

        # Block dangerous calls by bare name
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in BANNED_CALLS:
                print(json.dumps({"ok": False, "error": {"message": f"Disallowed call: {node.func.id}", "line": node.lineno}}))
                raise SystemExit(0)
            if node.func.id == "input":
                uses_input = True

        # Detect sys.argv usage (sys.argv only)
        if isinstance(node, ast.Attribute) and node.attr == "argv":
            val = getattr(node, "value", None)
            if isinstance(val, ast.Name) and val.id == "sys":
                uses_argv = True

        # Discourage catching Exception in user code
        if isinstance(node, ast.ExceptHandler):
            t = getattr(node, "type", None)
            if isinstance(t, ast.Name) and t.id == "Exception":
                print(json.dumps({"ok": False, "error": {"message": "Avoid catching 'Exception'; catch specific exception types", "line": node.lineno}}))
                raise SystemExit(0)

    # Require some input mechanism
    if not (uses_argv or uses_input):
        print(json.dumps({"ok": False, "error": {"message": "Script must read input via sys.argv or input()"}}))
        raise SystemExit(0)

except SyntaxError as e:
    print(json.dumps({"ok": False, "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}}))
    raise SystemExit(0)

# 1) Syntax check (no execution)
try:
    compile(src, "<user-code>", "exec")
except SyntaxError as e:
    print(json.dumps({
        "ok": False,
        "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}
    }))
    raise SystemExit(0)

# 2) Optional lint with pyflakes
issues = []
try:
    from pyflakes.api import check
    from pyflakes.reporter import Reporter
    buf = io.StringIO()
    rep = Reporter(buf, buf)
    check(src, "<user-code>", rep)
    out = buf.getvalue()
    if out:
        for ln in out.strip().splitlines():
            m = re.match(r'^[^:]+:(\\d+)(?::(\\d+))?:\\s*(.*)$', ln)
            if m:
                line = int(m.group(1))
                col = int(m.group(2)) if m.group(2) else None
                msg = m.group(3)
                issues.append({"message": msg, "line": line, "column": col})
            else:
                issues.append({"message": ln})
except Exception:
    # pyflakes not installed or failed; ignore
    pass

if issues:
    print(json.dumps({"ok": False, "error": issues[0], "errors": issues}))
else:
    print(json.dumps({"ok": True}))
`;

  const payload = Buffer.from(source, "utf8").toString("base64");
  try {
    const out = await PythonShell.runString(snippet, {
      args: [payload],
      pythonOptions: ["-I", "-S", "-B"],
      mode: "text",
    });
    const last = (Array.isArray(out) && out.length ? out[out.length - 1] : "").trim();
    if (!last) throw HTTPError(500, "Validator produced no output");
    return JSON.parse(last);
  } catch {
    throw HTTPError(500, "Failed to validate code");
  }
}

type SaveUserScriptResult = {
  ok: boolean;
  id?: string;
  file?: { path: string; bytes: number };
  bytecode?: { path: string; bytes: number };
  error?: { message: string; line?: number; column?: number; text?: string };
  errors?: Array<{ message: string; line?: number; column?: number; text?: string }>;
};

/**
 * Validate, then persist source and compile to bytecode without executing.
 * Files are stored under models/user_scripts using a content-based SHA-256 id.
 */
async function saveAndCompileUserPythonScript(source: string, language: string, name?: string): Promise<SaveUserScriptResult> {
  const validation = await validatePythonCode(source, language);
  if (!validation.ok) {
    return { ok: false, error: validation.error, errors: (validation as any).errors };
  }

  const id = crypto.createHash("sha256").update(source, "utf8").digest("hex");
  const baseDir = path.join(process.cwd(), "models", "user_scripts");
  ensureDir(baseDir);

  // If user provided a name, use it; otherwise fall back to content-hash filename
  const fileName = name ? sanitizeFilename(name) : `${id}.py`;
  const pyPath = path.join(baseDir, fileName);
  const pycPath = path.join(baseDir, `${path.parse(fileName).name}.pyc`);

  const snippet = `
import sys, base64, json, py_compile
b64 = sys.argv[1]; py_path = sys.argv[2]; pyc_path = sys.argv[3]
src = base64.b64decode(b64).decode("utf-8", "replace")
with open(py_path, "w", encoding="utf-8", newline="\\n") as f:
    f.write(src)
py_compile.compile(py_path, cfile=pyc_path, dfile="<user-code>", doraise=True)
print(json.dumps({"ok": True}))
`;

  const payload = Buffer.from(source, "utf8").toString("base64");
  try {
    const out = await PythonShell.runString(snippet, {
      args: [payload, pyPath, pycPath],
      pythonOptions: ["-I", "-S", "-B"],
      mode: "text",
    });
    const last = out.at(-1) ?? "{}";
    const res = JSON.parse(last);
    if (!res.ok) return { ok: false, error: { message: "Failed to persist/compile" } };
    const pyStat = fs.statSync(pyPath);
    const pycStat = fs.existsSync(pycPath) ? fs.statSync(pycPath) : (undefined as any);
    return {
      ok: true,
      id,
      file: { path: pyPath, bytes: pyStat.size },
      bytecode: { path: pycPath, bytes: pycStat ? (pycStat as fs.Stats).size : 0 },
    };
  } catch {
    throw HTTPError(500, "Failed to persist/compile code");
  }
}

type ExecuteUserScriptResult = {
  ok: boolean;
  result?: unknown;
  logs?: string[];
  error?: { message: string; line?: number; column?: number; text?: string };
};

/**
 * Execute a previously saved user script by its content-hash id.
 * Supports sys.argv and input() via injected argv and a safe input().
 */
async function executeSavedUserPythonScriptFlexible(identifier: string, inputs: unknown): Promise<ExecuteUserScriptResult> {
  if (typeof identifier !== "string" || !identifier.trim()) {
    throw HTTPError(400, "Missing script identifier");
  }
  const baseDir = path.join(process.cwd(), "models", "user_scripts");
  let pyPath: string;
  if (/^[a-f0-9]{64}$/.test(identifier)) {
    // Treat as content hash id
    pyPath = path.join(baseDir, `${identifier}.py`);
  } else {
    // Treat as user-supplied filename
    const fileName = sanitizeFilename(identifier);
    if (!fileName) throw HTTPError(400, "Invalid script name");
    pyPath = path.join(baseDir, fileName);
  }
  if (!fs.existsSync(pyPath)) {
    throw HTTPError(404, "Script not found");
  }
  const source = fs.readFileSync(pyPath, "utf8");

  // Build numeric argv values
  let argvVals: number[];
  if (Array.isArray(inputs)) {
    const arr = inputs as any[];
    argvVals = arr.map((v) => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const f = parseFloat(v);
        if (Number.isFinite(f)) return f;
      }
      return parseFloat((Math.random() * 100).toFixed(2));
    });
    if (argvVals.length === 0) argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
  } else {
    argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
  }

  const runner = `
import sys, json, base64, ast, io, threading, traceback

# --- hard timeout using a watchdog thread (SIGKILL-like) ---
def _force_exit_after(seconds: float):
    import os
    t = threading.Timer(seconds, lambda: os._exit(124))
    t.daemon = True
    t.start()
    return t

# --- best-effort line extraction from traceback ---
def _tb_line(ex):
    try:
        tb = traceback.extract_tb(ex.__traceback__)
        if tb:
            return tb[-1].lineno
    except Exception:
        pass
    return None

# --- inputs: base64-encoded code + JSON array of argv values ---
code_b64 = sys.argv[1]
inputs_json = sys.argv[2]
src = base64.b64decode(code_b64).decode("utf-8", "replace")

# wall-clock timeout (watchdog), independent from CPU limit
TIME_SEC = 2.5
t = _force_exit_after(TIME_SEC)

try:
    # --- resource limits (best effort; ignored where unsupported) ---
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (2, 2))  # ~2s CPU
        resource.setrlimit(resource.RLIMIT_AS, (256*1024*1024, 256*1024*1024))  # 256MB RAM
        resource.setrlimit(resource.RLIMIT_FSIZE, (1024*1024, 1024*1024))  # 1MB file writes
    except Exception:
        pass

    # --- static AST pre-scan to block imports/calls before exec ---
    banned_imports = {
        "os","subprocess","socket","pathlib","shutil","ctypes",
        "multiprocessing","threading","asyncio","resource","signal",
        "builtins","importlib","site","sitecustomize","runpy",
        "http","urllib","requests","ftplib","ssl"
    }
    banned_calls = {"eval","exec","__import__","open"}

    try:
        tree = ast.parse(src, filename="<user-code>", mode="exec")
        for node in ast.walk(tree):
            # imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = (alias.name or "").split(".")[0]
                    if name in banned_imports:
                        print(json.dumps({"ok": False, "error": {"message": f"Disallowed import: {name}", "line": node.lineno}}))
                        raise SystemExit(0)
            if isinstance(node, ast.ImportFrom):
                base = (node.module or "").split(".")[0]
                if base in banned_imports:
                    print(json.dumps({"ok": False, "error": {"message": f"Disallowed import: {base}", "line": node.lineno}}))
                    raise SystemExit(0)
            # calls
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in banned_calls:
                    print(json.dumps({"ok": False, "error": {"message": f"Disallowed call: {node.func.id}", "line": node.lineno}}))
                    raise SystemExit(0)
    except SyntaxError as e:
        print(json.dumps({"ok": False, "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}}))
        raise SystemExit(0)

    # --- sandbox builtins + controlled import ---
    import builtins as _bi
    _allow = {
        "abs","min","max","sum","len","range","enumerate","map","filter","sorted","reversed",
        "list","dict","set","tuple","float","int","str","bool","zip","any","all","round","print"
    }
    SAFE_BUILTINS = {k: getattr(_bi, k) for k in _allow if hasattr(_bi, k)}

    ALLOWED_IMPORTS = {"sys","math","json"}
    def _restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
        root = (name or "").split(".")[0]
        if root not in ALLOWED_IMPORTS:
            raise ImportError(f"Import of '{root}' is blocked")
        return _bi.__import__(name, globals, locals, fromlist, level)

    SAFE_BUILTINS["__import__"] = _restricted_import

    # user code runs in this namespace
    ns = {"__builtins__": SAFE_BUILTINS, "__name__": "__not_main__"}

    # --- parse argv values (JSON array) ---
    try:
        argv_vals = json.loads(inputs_json)
        if not isinstance(argv_vals, list):
            raise ValueError("Expected JSON array for args")
    except Exception:
        print(json.dumps({"ok": False, "error": {"message": "Invalid inputs"}}))
        raise SystemExit(0)

    # debug to stderr to avoid corrupting stdout JSON
    print("runner argv:", argv_vals, file=sys.stderr)
    sys.argv = ["<user-code>"] + [str(v) for v in argv_vals]
    print("runner sys.argv:", sys.argv, file=sys.stderr)

    # --- provide input() shim that consumes argv values in order ---
    def _make_input(vals):
        it = iter([str(v) for v in vals])
        def _input(prompt=None):
            try:
                return next(it)
            except StopIteration:
                raise EOFError()
        return _input
    ns["input"] = _make_input(argv_vals)

    # --- compile & execute user code ---
    try:
        code_obj = compile(src, "<user-code>", "exec")
        exec(code_obj, ns, ns)
    except Exception as e:
        print(json.dumps({"ok": False, "error": {"message": str(e), "line": _tb_line(e)}}))
        raise SystemExit(0)

    # --- sanitize result for JSON serialization ---
    def _sanitize(v):
        if isinstance(v, (int, float, str, bool)) or v is None:
            return v
        if isinstance(v, (list, tuple)):
            return [_sanitize(x) for x in v]
        if isinstance(v, dict):
            return {str(k): _sanitize(val) for k, val in v.items()}
        return str(v)

    res_val = ns.get("result", None)
    print(json.dumps({"ok": True, "result": _sanitize(res_val)}))

finally:
    # cancel watchdog if we got here in time
    try:
        t.cancel()
    except Exception:
        pass
`;

  try {
    const out = await PythonShell.runString(runner, {
      pythonOptions: ["-I", "-u"],
      args: [Buffer.from(source, "utf8").toString("base64"), JSON.stringify(argvVals)],
      mode: "text",
    });
    const last = out.at(-1) ?? "";
    const data = JSON.parse(last);
    if (data.ok) return { ok: true, result: data.result, logs: out };
    return { ok: false, error: data.error, logs: out };
  } catch {
    return { ok: false, error: { message: "Failed to execute user script (timeout or runner error)" } };
  }
}

export {
  validatePythonCode,
  saveAndCompileUserPythonScript,
  executeSavedUserPythonScriptFlexible,
};
