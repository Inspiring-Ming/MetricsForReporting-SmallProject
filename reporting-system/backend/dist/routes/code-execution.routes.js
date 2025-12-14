"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const code_execution_controller_1 = require("../controllers/code-execution.controller");
const router = (0, express_1.Router)();
const codeExecutionController = new code_execution_controller_1.CodeExecutionController();
/**
 * Code Execution Routes
 * Base path: /SAGE/code
 */
// Validate Python code
router.post("/validate", codeExecutionController.validateCode);
// Submit and compile Python script
router.post("/submit", codeExecutionController.submitCode);
// Execute saved Python script
router.post("/execute", codeExecutionController.executeCode);
exports.default = router;
