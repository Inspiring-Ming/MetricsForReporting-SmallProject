// SAGE – System for Automated Generation of ESG

import express from "express";
import errorHandler from "middleware-http-errors";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import { getCompanyIndustry, getMetric } from "./dynamoDB/dynamoDBHandler";
// import {
//   getReportFramework,
//   getCategoriesByIndustryAndReportFramework,
//   getMetricsByIndustryAndCategory,
//   getImplementationByModel,
//   getImplementationDetails,
//   getAllImplementations,
//   getImplementationsByCalculationType,
//   getAllCalculationTypes,
// } from "./KG/queryGraph";

import {
  getMetricComputationMethod,
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
const HOST: string = process.env.HOST || "localhost";

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
// ============================= KG FUNCTIONS ============================== //
// ========================================================================= //

// /**
//  *
//  * CQ2: Which Reporting Framework applies to [specific industry]?
//  * 🔍 GET: Obtain all reporting frameworks relevant to the specific industry.
//  */
// app.get("/SAGE/KG/retrieve/framework", async (req, res) => {
//   const industry = req.query.industry as string;

//   try {
//     const result = await getReportFramework(industry);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  *
//  * CQ3: What Categories are included within the [reporting framework]?
//  * 🔍 GET: Get categories data by industry and report framework
//  */
// app.get("/SAGE/KG/retrieve/categories", async (req, res) => {
//   const industry = req.query.industry as string;
//   const framework = req.query.framework as string;

//   try {
//     const result = await getCategoriesByIndustryAndReportFramework(industry, framework);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  *
//  * CQ4: Which Metrics are classified under [specific category]?
//  * 🔍 GET: Get metrics data under specific category label, industry and report framework
//  */
// app.get("/SAGE/KG/retrieve/category/metrics", async (req, res) => {
//   const industry = req.query.industry as string;
//   const category_label = req.query.category_label as string;
//   const framework = req.query.framework as string;

//   try {
//     const result = await getMetricsByIndustryAndCategory(industry, category_label, framework);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  * CQ5: How is the value of [specific metric] calculated or directly measured?
//  * CQ7: What Metrics are required as inputs for calculating [specific model]?
//  * 🔍 GET: Get metric computation method by metric label
//  */
app.get("/SAGE/KG/metric/computation/method", async (req, res) => {
  const metric_label = req.query.metric_label as string;

  try {
    const result = await getMetricComputationMethod(metric_label);
    res.json(result);
  } catch (error) {
    handleHttpError(res, error);
  }
});

// /**
//  * CQ6: Which Implementation is used to execute [specific model]?
//  * 🔍 GET: Get implementation details for a specific model
//  */
// app.get("/SAGE/KG/model/implementation", async (req, res) => {
//   const model_label = req.query.model_label as string;

//   try {
//     const result = await getImplementationByModel(model_label);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  * 🔍 GET: Get detailed information about a specific implementation
//  */
// app.get("/SAGE/KG/implementation/details", async (req, res) => {
//   const implementation_label = req.query.implementation_label as string;

//   try {
//     const result = await getImplementationDetails(implementation_label);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  * 🔍 GET: Get all available implementations
//  */
// app.get("/SAGE/KG/implementations", async (req, res) => {
//   try {
//     const result = await getAllImplementations();
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  * 🔍 GET: Get implementations by calculation type
//  */
// app.get("/SAGE/KG/implementations/by-calculation-type", async (req, res) => {
//   const calculation_type = req.query.calculation_type as string;

//   try {
//     const result = await getImplementationsByCalculationType(calculation_type);
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });

// /**
//  * 🔍 GET: Get all available calculation type
//  */
// app.get("/SAGE/KG/calculation-types", async (req, res) => {
//   try {
//     const result = await getAllCalculationTypes();
//     res.json(result);
//   } catch (error) {
//     handleHttpError(res, error);
//   }
// });



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
