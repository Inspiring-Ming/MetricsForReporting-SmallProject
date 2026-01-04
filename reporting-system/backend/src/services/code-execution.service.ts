import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PythonShell } from "python-shell";
import { ValidationError, InternalServerError, NotFoundError, BadRequestError, PayloadTooLargeError } from "../errors";
import type {
  ValidatePythonScriptResponse,
  SaveScriptResponse,
  ExecuteScriptResponse,
} from "../models/code-execution.model";

/**
 * Code Execution Service
 * Handles Python code validation, compilation, and execution
 */
export class CodeExecutionService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "models", "user_scripts");
    this.ensureDir(this.baseDir);
  }

  private ensureDir(p: string): void {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }

  private sanitizeFilename(name: string): string {
    const trimmed = (name || "").trim();
    if (!trimmed) return "";
    const base = trimmed.replace(/[/\\:*?"<>|]+/g, "").replace(/\s+/g, "_");
    const just = path.basename(base);
    return just.toLowerCase().endsWith(".py") ? just : `${just}.py`;
  }

  /**
   * Validate Python code syntax without executing it
   */
  async validatePythonCode(
    source: string,
    language: string
  ): Promise<ValidatePythonScriptResponse> {
    if (language !== "python") {
      throw new BadRequestError("Unsupported language");
    }

    if (typeof source !== "string") {
      throw new BadRequestError("Invalid 'code' payload");
    }

    const MAX_CODE_BYTES = 100 * 1024; // 100KB
    if (Buffer.byteLength(source, "utf8") > MAX_CODE_BYTES) {
      throw new PayloadTooLargeError("Code too large");
    }

    const validationSnippet = this.getValidationSnippet();
    const payload = Buffer.from(source, "utf8").toString("base64");

    try {
      const out = await PythonShell.runString(validationSnippet, {
        args: [payload],
        pythonOptions: ["-I", "-S", "-B"],
        mode: "text",
      });

      const last = (Array.isArray(out) && out.length ? out[out.length - 1] : "").trim();
      if (!last) {
        throw new InternalServerError("Validator produced no output");
      }

      return JSON.parse(last);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof InternalServerError) {
        throw error;
      }
      throw new InternalServerError("Failed to validate code");
    }
  }

  /**
   * Save and compile Python script
   */
  async saveAndCompileScript(
    source: string,
    language: string,
    name?: string
  ): Promise<SaveScriptResponse> {
    const validation = await this.validatePythonCode(source, language);

    if (!validation.ok) {
      return {
        ok: false,
        error: validation.error,
        errors: (validation as any).errors,
      };
    }

    const id = crypto.createHash("sha256").update(source, "utf8").digest("hex");
    const fileName = name ? this.sanitizeFilename(name) : `${id}.py`;
    const pyPath = path.join(this.baseDir, fileName);
    const pycPath = path.join(this.baseDir, `${path.parse(fileName).name}.pyc`);

    const compileSnippet = this.getCompileSnippet();
    const payload = Buffer.from(source, "utf8").toString("base64");

    try {
      const out = await PythonShell.runString(compileSnippet, {
        args: [payload, pyPath, pycPath],
        pythonOptions: ["-I", "-S", "-B"],
        mode: "text",
      });

      const last = out.at(-1) ?? "{}";
      const res = JSON.parse(last);

      if (!res.ok) {
        return { ok: false, error: { message: "Failed to persist/compile" } };
      }

      const pyStat = fs.statSync(pyPath);
      const pycStat = fs.existsSync(pycPath) ? fs.statSync(pycPath) : undefined;

      return {
        ok: true,
        id,
        file: { path: pyPath, bytes: pyStat.size },
        bytecode: { path: pycPath, bytes: pycStat ? pycStat.size : 0 },
      };
    } catch (error: any) {
      throw new InternalServerError("Failed to persist/compile code");
    }
  }

  /**
   * Execute a saved Python script
   */
  async executeScript(
    identifier: string,
    inputs: unknown
  ): Promise<ExecuteScriptResponse> {
    if (typeof identifier !== "string" || !identifier.trim()) {
      throw new BadRequestError("Missing script identifier");
    }

    let pyPath: string;
    if (/^[a-f0-9]{64}$/.test(identifier)) {
      pyPath = path.join(this.baseDir, `${identifier}.py`);
    } else {
      const fileName = this.sanitizeFilename(identifier);
      if (!fileName) {
        throw new BadRequestError("Invalid script name");
      }
      pyPath = path.join(this.baseDir, fileName);
    }

    if (!fs.existsSync(pyPath)) {
      throw new NotFoundError("Script not found");
    }

    const source = fs.readFileSync(pyPath, "utf8");

    // Build numeric argv values
    let argvVals: number[];
    if (Array.isArray(inputs)) {
      argvVals = (inputs as any[]).map((v) => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const f = parseFloat(v);
          if (Number.isFinite(f)) return f;
        }
        return parseFloat((Math.random() * 100).toFixed(2));
      });
      if (argvVals.length === 0) {
        argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
      }
    } else {
      argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
    }

    const runner = this.getExecutionRunner();

    try {
      const out = await PythonShell.runString(runner, {
        pythonOptions: ["-I", "-u"],
        args: [
          Buffer.from(source, "utf8").toString("base64"),
          JSON.stringify(argvVals),
        ],
        mode: "text",
      });

      const last = out.at(-1) ?? "";
      const data = JSON.parse(last);

      if (data.ok) {
        return { ok: true, result: data.result };
      }

      return { ok: false, error: data.error };
    } catch (error: any) {
      return {
        ok: false,
        error: { message: "Failed to execute user script (timeout or runner error)" },
      };
    }
  }

  // Helper methods for Python snippets
  private getValidationSnippet(): string {
    return `
import sys, base64, json, io, re, ast

b64 = sys.argv[1] if len(sys.argv) > 1 else ""
try:
    src = base64.b64decode(b64).decode("utf-8", "replace")
except Exception:
    print(json.dumps({"ok": False, "error": {"message": "Invalid payload"}}))
    raise SystemExit(0)

ALLOWED_IMPORTS = {"sys", "math", "json"}
BANNED_CALLS = {"eval", "exec", "__import__", "open"}

uses_argv = False
uses_input = False

try:
    tree = ast.parse(src, filename="<user-code>", mode="exec")

    for node in ast.walk(tree):
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

        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in BANNED_CALLS:
                print(json.dumps({"ok": False, "error": {"message": f"Disallowed call: {node.func.id}", "line": node.lineno}}))
                raise SystemExit(0)
            if node.func.id == "input":
                uses_input = True

        if isinstance(node, ast.Attribute) and node.attr == "argv":
            val = getattr(node, "value", None)
            if isinstance(val, ast.Name) and val.id == "sys":
                uses_argv = True

        if isinstance(node, ast.ExceptHandler):
            t = getattr(node, "type", None)
            if isinstance(t, ast.Name) and t.id == "Exception":
                print(json.dumps({"ok": False, "error": {"message": "Avoid catching 'Exception'; catch specific exception types", "line": node.lineno}}))
                raise SystemExit(0)

    if not (uses_argv or uses_input):
        print(json.dumps({"ok": False, "error": {"message": "Script must read input via sys.argv or input()"}}))
        raise SystemExit(0)

except SyntaxError as e:
    print(json.dumps({"ok": False, "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}}))
    raise SystemExit(0)

try:
    compile(src, "<user-code>", "exec")
except SyntaxError as e:
    print(json.dumps({"ok": False, "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}}))
    raise SystemExit(0)

print(json.dumps({"ok": True}))
`;
  }

  private getCompileSnippet(): string {
    return `
import sys, base64, json, py_compile
b64 = sys.argv[1]; py_path = sys.argv[2]; pyc_path = sys.argv[3]
src = base64.b64decode(b64).decode("utf-8", "replace")
with open(py_path, "w", encoding="utf-8", newline="\\n") as f:
    f.write(src)
py_compile.compile(py_path, cfile=pyc_path, dfile="<user-code>", doraise=True)
print(json.dumps({"ok": True}))
`;
  }

  private getExecutionRunner(): string {
    return `
import sys, json, base64, ast, io, threading, traceback

def _force_exit_after(seconds: float):
    import os
    t = threading.Timer(seconds, lambda: os._exit(124))
    t.daemon = True
    t.start()
    return t

def _tb_line(ex):
    try:
        tb = traceback.extract_tb(ex.__traceback__)
        if tb:
            return tb[-1].lineno
    except Exception:
        pass
    return None

code_b64 = sys.argv[1]
inputs_json = sys.argv[2]
src = base64.b64decode(code_b64).decode("utf-8", "replace")

TIME_SEC = 2.5
t = _force_exit_after(TIME_SEC)

try:
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
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in banned_calls:
                    print(json.dumps({"ok": False, "error": {"message": f"Disallowed call: {node.func.id}", "line": node.lineno}}))
                    raise SystemExit(0)
    except SyntaxError as e:
        print(json.dumps({"ok": False, "error": {"message": e.msg, "line": e.lineno, "column": e.offset, "text": e.text}}))
        raise SystemExit(0)

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
    ns = {"__builtins__": SAFE_BUILTINS, "__name__": "__not_main__"}

    try:
        argv_vals = json.loads(inputs_json)
        if not isinstance(argv_vals, list):
            raise ValueError("Expected JSON array for args")
    except Exception:
        print(json.dumps({"ok": False, "error": {"message": "Invalid inputs"}}))
        raise SystemExit(0)

    sys.argv = ["<user-code>"] + [str(v) for v in argv_vals]

    def _make_input(vals):
        it = iter([str(v) for v in vals])
        def _input(prompt=None):
            try:
                return next(it)
            except StopIteration:
                raise EOFError()
        return _input
    ns["input"] = _make_input(argv_vals)

    try:
        code_obj = compile(src, "<user-code>", "exec")
        exec(code_obj, ns, ns)
    except Exception as e:
        print(json.dumps({"ok": False, "error": {"message": str(e), "line": _tb_line(e)}}))
        raise SystemExit(0)

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
    try:
        t.cancel()
    except Exception:
        pass
`;
  }
}
