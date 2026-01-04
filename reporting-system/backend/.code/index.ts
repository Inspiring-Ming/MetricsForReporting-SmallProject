// SAGE – System for Automated Generation of ESG

import express from "express";
import errorHandler from "middleware-http-errors";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import { getCompanyIndustry, getMetric } from "./dynamoDB/dynamoDBHandler";
import {
  getMetricValue,
  modelExecutaion,
} from "./metricComputation/getMetricComputationMethod";
import {
  validatePythonCode,
  saveAndCompileUserPythonScript,
  executeSavedUserPythonScriptFlexible,
} from "./metricComputation/implementationUpload";
import { generateReport, delGeneratedReport } from "./reportGeneration/reportGen";
import path from "path";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3001");
const HOST: string = process.env.HOST || "0.0.0.0";

// Use middleware that allows us to access the JSON body of requests
app.use(express.json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan("dev"));
// for error handling
app.use(errorHandler());
// Serve static files for generated reports
app.use('/Testing_report', express.static(path.join(process.cwd(), 'Testing_report')));

// ========================================================================= //
// =========================== DATABASE SYSTEM ============================= //
// ========================================================================= //

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/SAGE/dynamoDB/echo", (req, res) => {
  res.send("SAGE DynamoDB API is running😍😍");
});

// ========================================================================= //
// ========================== DATABASE FUNCTIONS =========================== //
// ========================================================================= //

// 🔍 GET: Get metric data by company's perm id, metric name and reported year
app.get("/SAGE/dynamoDB/retrieve", async (req, res) => {
  const perm_id = req.query.perm_id as string;
  const metric_name = req.query.metric_name as string;
  const year = req.query.year as string;

  try {
    const result = await getMetric(perm_id, metric_name, year);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

/**
 *
 * CQ1: Which Industry does [company X] belong to?
 * 🔍 GET: Industry that company belong to given their perm id
 */
app.get("/SAGE/dynamoDB/company/info", async (req, res) => {
  const perm_id = req.query.perm_id as string;

  try {
    const result = await getCompanyIndustry(perm_id);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //
// ========================== METRIC FUNCTIONS ============================= //
// ========================================================================= //

/**
 * CQ8: What are the historical Values of [specific datapoint]?
 * 🔍 GET: Get metric's value method
 * by metric name, perm id and reported year
 * add company name, metrics_unit, perm_id, year
 *
 */
app.get("/SAGE/dynamoDB/metric/value", async (req, res) => {
  const perm_id = req.query.perm_id as string;
  const metric_name = req.query.metric_name as string;
  const year = req.query.year as string;

  try {
    const result = await getMetricValue(perm_id, metric_name, year);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //
// ======================== COMPUTATION FUNCTIONS ========================== //
// ========================================================================= //

/**
 *
 *
 * 🧮 GET: Model Computation result
 */
app.post("/SAGE/model/computation", async (req, res) => {
  const { perm_id, calculation_type, year, metricArray } = req.body;

  try {
    const result = await modelExecutaion(perm_id, calculation_type, year, metricArray);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //
// ============================ CODE UTILITIES ============================== //
// ========================================================================= //

app.post("/SAGE/code/validate", async (req, res) => {
  const { language, code } = req.body || {};
  try {
    const result = await validatePythonCode(code, language);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

app.post("/SAGE/code/submit", async (req, res) => {
  const { language, code, name } = req.body || {};
  try {
    const result = await saveAndCompileUserPythonScript(code, language, name);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

app.post("/SAGE/code/execute", async (req, res) => {
  const { id, script_name, inputs } = req.body || {};
  const identifier = script_name || id;
  console.log("Executing saved user script identifier:", identifier);
  try {
    const result = await executeSavedUserPythonScriptFlexible(identifier, inputs);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //
// ===================== REPORT GENERATION FUNCTIONS ======================= //
// ========================================================================= //

/**
 * 📄 POST: Generate ESG Report (PDF or HTML)
 * Accepts report data and generates a downloadable file
 */
app.post("/SAGE/report/generate", async (req, res) => {
  const { fileType, data } = req.body;

  try {
    const result = await generateReport(fileType, data);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

/**
 * 🗑️ DELETE: Delete a generated report file
 */
app.delete("/SAGE/report/:fileName", async (req, res) => {
  const { fileName } = req.params;

  try {
    const result = delGeneratedReport(fileName);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// ========================================================================= //
// ========================== HELPER FUNCTIONS ============================= //
// ========================================================================= //

function handleHttpError(res: any, error: any) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  console.error("❌", message);
  res.status(status).json({ error: message });
}

// ========================================================================= //
// ============================= APPLICATION =============================== //
// ========================================================================= //

// For serverless if deploying on lambda
// export const handler = serverless(app);

// start local server
const server = app.listen(PORT, HOST, async () => {
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// Catch listen() errors like EADDRINUSE (port in use) or EACCES (permission denied)
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  } else if (err.code === "EACCES") {
    console.error(`❌ Permission denied for port ${PORT}. Try running with elevated privileges or a different port.`);
  } else {
    console.error("❌ Server failed to start:", err);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => console.log("\nShutting down server."));
});

// GSI: Global Secondary Index
