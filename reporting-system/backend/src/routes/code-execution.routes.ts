import { Router } from "express";
import { CodeExecutionController } from "../controllers/code-execution.controller";

const router = Router();
const codeExecutionController = new CodeExecutionController();

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

export default router;
