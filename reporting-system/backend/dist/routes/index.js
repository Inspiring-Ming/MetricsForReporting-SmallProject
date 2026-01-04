"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const company_routes_1 = __importDefault(require("./company.routes"));
const code_execution_routes_1 = __importDefault(require("./code-execution.routes"));
const computation_routes_1 = __importDefault(require("./computation.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const router = (0, express_1.Router)();
/**
 * Main router
 * Aggregates all route modules
 */
// Health check routes
router.use("/", health_routes_1.default);
// Company and DynamoDB routes
router.use("/SAGE/dynamoDB", company_routes_1.default);
// Code execution routes
router.use("/SAGE/code", code_execution_routes_1.default);
// Model computation routes
router.use("/SAGE/model", computation_routes_1.default);
// Report generation routes
router.use("/SAGE/report", report_routes_1.default);
exports.default = router;
