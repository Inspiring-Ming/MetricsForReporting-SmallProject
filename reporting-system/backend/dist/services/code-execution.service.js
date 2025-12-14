"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecutionService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const python_shell_1 = require("python-shell");
const errors_1 = require("../errors");
/**
 * Code Execution Service
 * Handles Python code validation, compilation, and execution
 */
class CodeExecutionService {
    constructor() {
        this.baseDir = path_1.default.join(process.cwd(), "models", "user_scripts");
        this.ensureDir(this.baseDir);
    }
    ensureDir(p) {
        if (!fs_1.default.existsSync(p)) {
            fs_1.default.mkdirSync(p, { recursive: true });
        }
    }
    sanitizeFilename(name) {
        const trimmed = (name || "").trim();
        if (!trimmed)
            return "";
        const base = trimmed.replace(/[/\\:*?"<>|]+/g, "").replace(/\s+/g, "_");
        const just = path_1.default.basename(base);
        return just.toLowerCase().endsWith(".py") ? just : `${just}.py`;
    }
    /**
     * Validate Python code syntax without executing it
     */
    async validatePythonCode(source, language) {
        if (language !== "python") {
            throw new errors_1.BadRequestError("Unsupported language");
        }
        if (typeof source !== "string") {
            throw new errors_1.BadRequestError("Invalid 'code' payload");
        }
        const MAX_CODE_BYTES = 100 * 1024; // 100KB
        if (Buffer.byteLength(source, "utf8") > MAX_CODE_BYTES) {
            throw new errors_1.PayloadTooLargeError("Code too large");
        }
        const validationSnippet = this.getValidationSnippet();
        const payload = Buffer.from(source, "utf8").toString("base64");
        try {
            const out = await python_shell_1.PythonShell.runString(validationSnippet, {
                args: [payload],
                pythonOptions: ["-I", "-S", "-B"],
                mode: "text",
            });
            const last = (Array.isArray(out) && out.length ? out[out.length - 1] : "").trim();
            if (!last) {
                throw new errors_1.InternalServerError("Validator produced no output");
            }
            return JSON.parse(last);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.InternalServerError) {
                throw error;
            }
            throw new errors_1.InternalServerError("Failed to validate code");
        }
    }
    /**
     * Save and compile Python script
     */
    async saveAndCompileScript(source, language, name) {
        const validation = await this.validatePythonCode(source, language);
        if (!validation.ok) {
            return {
                ok: false,
                error: validation.error,
                errors: validation.errors,
            };
        }
        const id = crypto_1.default.createHash("sha256").update(source, "utf8").digest("hex");
        const fileName = name ? this.sanitizeFilename(name) : `${id}.py`;
        const pyPath = path_1.default.join(this.baseDir, fileName);
        const pycPath = path_1.default.join(this.baseDir, `${path_1.default.parse(fileName).name}.pyc`);
        const compileSnippet = this.getCompileSnippet();
        const payload = Buffer.from(source, "utf8").toString("base64");
        try {
            const out = await python_shell_1.PythonShell.runString(compileSnippet, {
                args: [payload, pyPath, pycPath],
                pythonOptions: ["-I", "-S", "-B"],
                mode: "text",
            });
            const last = out.at(-1) ?? "{}";
            const res = JSON.parse(last);
            if (!res.ok) {
                return { ok: false, error: { message: "Failed to persist/compile" } };
            }
            const pyStat = fs_1.default.statSync(pyPath);
            const pycStat = fs_1.default.existsSync(pycPath) ? fs_1.default.statSync(pycPath) : undefined;
            return {
                ok: true,
                id,
                file: { path: pyPath, bytes: pyStat.size },
                bytecode: { path: pycPath, bytes: pycStat ? pycStat.size : 0 },
            };
        }
        catch (error) {
            throw new errors_1.InternalServerError("Failed to persist/compile code");
        }
    }
    /**
     * Execute a saved Python script
     */
    async executeScript(identifier, inputs) {
        if (typeof identifier !== "string" || !identifier.trim()) {
            throw new errors_1.BadRequestError("Missing script identifier");
        }
        let pyPath;
        if (/^[a-f0-9]{64}$/.test(identifier)) {
            pyPath = path_1.default.join(this.baseDir, `${identifier}.py`);
        }
        else {
            const fileName = this.sanitizeFilename(identifier);
            if (!fileName) {
                throw new errors_1.BadRequestError("Invalid script name");
            }
            pyPath = path_1.default.join(this.baseDir, fileName);
        }
        if (!fs_1.default.existsSync(pyPath)) {
            throw new errors_1.NotFoundError("Script not found");
        }
        const source = fs_1.default.readFileSync(pyPath, "utf8");
        // Build numeric argv values
        let argvVals;
        if (Array.isArray(inputs)) {
            argvVals = inputs.map((v) => {
                if (typeof v === "number" && Number.isFinite(v))
                    return v;
                if (typeof v === "string") {
                    const f = parseFloat(v);
                    if (Number.isFinite(f))
                        return f;
                }
                return parseFloat((Math.random() * 100).toFixed(2));
            });
            if (argvVals.length === 0) {
                argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
            }
        }
        else {
            argvVals = [parseFloat((Math.random() * 100).toFixed(2))];
        }
        const runner = this.getExecutionRunner();
        try {
            const out = await python_shell_1.PythonShell.runString(runner, {
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
        }
        catch (error) {
            return {
                ok: false,
                error: { message: "Failed to execute user script (timeout or runner error)" },
            };
        }
    }
    // Helper methods for Python snippets
    getValidationSnippet() {
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
    getCompileSnippet() {
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
    getExecutionRunner() {
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
exports.CodeExecutionService = CodeExecutionService;
