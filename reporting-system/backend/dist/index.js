"use strict";
// SAGE – System for Automated Generation of ESG
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_http_errors_1 = __importDefault(require("middleware-http-errors"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dynamoDBHandler_1 = require("./dynamoDB/dynamoDBHandler");
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
const getMetricComputationMethod_1 = require("./metricComputation/getMetricComputationMethod");
const implementationUpload_1 = require("./metricComputation/implementationUpload");
const reportGen_1 = require("./reportGeneration/reportGen");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "localhost";
// Use middleware that allows us to access the JSON body of requests
app.use(express_1.default.json());
// Use middleware that allows for access from other domains
app.use((0, cors_1.default)());
// for logging errors (print to terminal)
app.use((0, morgan_1.default)("dev"));
// for error handling
app.use((0, middleware_http_errors_1.default)());
// Serve static files for generated reports
app.use('/Testing_report', express_1.default.static(path_1.default.join(process.cwd(), 'Testing_report')));
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
    const perm_id = req.query.perm_id;
    const metric_name = req.query.metric_name;
    const year = req.query.year;
    try {
        const result = await (0, dynamoDBHandler_1.getMetric)(perm_id, metric_name, year);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
/**
 *
 * CQ1: Which Industry does [company X] belong to?
 * 🔍 GET: Industry that company belong to given their perm id
 */
app.get("/SAGE/dynamoDB/company/info", async (req, res) => {
    const perm_id = req.query.perm_id;
    try {
        const result = await (0, dynamoDBHandler_1.getCompanyIndustry)(perm_id);
        res.json(result);
    }
    catch (error) {
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
    const metric_label = req.query.metric_label;
    try {
        const result = await (0, getMetricComputationMethod_1.getMetricComputationMethod)(metric_label);
        res.json(result);
    }
    catch (error) {
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
    const perm_id = req.query.perm_id;
    const metric_name = req.query.metric_name;
    const year = req.query.year;
    try {
        const result = await (0, getMetricComputationMethod_1.getMetricValue)(perm_id, metric_name, year);
        res.json(result);
    }
    catch (error) {
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
        const result = await (0, getMetricComputationMethod_1.modelExecutaion)(perm_id, calculation_type, year, metricArray);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
// ========================================================================= //
// ============================ CODE UTILITIES ============================== //
// ========================================================================= //
app.post("/SAGE/code/validate", async (req, res) => {
    const { language, code } = req.body || {};
    try {
        const result = await (0, implementationUpload_1.validatePythonCode)(code, language);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
app.post("/SAGE/code/submit", async (req, res) => {
    const { language, code, name } = req.body || {};
    try {
        const result = await (0, implementationUpload_1.saveAndCompileUserPythonScript)(code, language, name);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
app.post("/SAGE/code/execute", async (req, res) => {
    const { id, script_name, inputs } = req.body || {};
    const identifier = script_name || id;
    console.log("Executing saved user script identifier:", identifier);
    try {
        const result = await (0, implementationUpload_1.executeSavedUserPythonScriptFlexible)(identifier, inputs);
        res.json(result);
    }
    catch (error) {
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
        const result = await (0, reportGen_1.generateReport)(fileType, data);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
/**
 * 🗑️ DELETE: Delete a generated report file
 */
app.delete("/SAGE/report/:fileName", async (req, res) => {
    const { fileName } = req.params;
    try {
        const result = (0, reportGen_1.delGeneratedReport)(fileName);
        res.json(result);
    }
    catch (error) {
        handleHttpError(res, error);
    }
});
// ========================================================================= //
// ========================== HELPER FUNCTIONS ============================= //
// ========================================================================= //
function handleHttpError(res, error) {
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
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    }
    else if (err.code === "EACCES") {
        console.error(`❌ Permission denied for port ${PORT}. Try running with elevated privileges or a different port.`);
    }
    else {
        console.error("❌ Server failed to start:", err);
    }
    process.exit(1);
});
process.on("SIGINT", () => {
    server.close(() => console.log("\nShutting down server."));
});
// GSI: Global Secondary Index
