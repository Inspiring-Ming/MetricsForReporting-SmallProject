/**
 * Code Execution Models
 */

export interface ValidatePythonScriptResponse {
  ok: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
    text?: string;
  };
}

export interface SaveScriptResponse {
  ok: boolean;
  id?: string;
  file?: { path: string; bytes: number };
  bytecode?: { path: string; bytes: number };
  error?: { message: string; line?: number; column?: number; text?: string };
  errors?: Array<{ message: string; line?: number; column?: number; text?: string }>;
}

export interface ExecuteScriptResponse {
  ok: boolean;
  result?: unknown;
  logs?: string[];
  error?: { message: string; line?: number; column?: number; text?: string };
}
