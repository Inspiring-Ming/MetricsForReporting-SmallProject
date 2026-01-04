"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecutionController = void 0;
const code_execution_service_1 = require("../services/code-execution.service");
/**
 * Code Execution Controller
 * Handles HTTP requests for Python code validation, compilation, and execution
 */
class CodeExecutionController {
    constructor(codeExecutionService) {
        /**
         * POST /SAGE/code/validate
         * Validate Python code syntax
         */
        this.validateCode = async (req, res, next) => {
            try {
                const { language, code } = req.body || {};
                const result = await this.codeExecutionService.validatePythonCode(code, language);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * POST /SAGE/code/submit
         * Submit and compile Python script
         */
        this.submitCode = async (req, res, next) => {
            try {
                const { language, code, name } = req.body || {};
                const result = await this.codeExecutionService.saveAndCompileScript(code, language, name);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * POST /SAGE/code/execute
         * Execute saved Python script
         */
        this.executeCode = async (req, res, next) => {
            try {
                const { id, script_name, inputs } = req.body || {};
                const identifier = script_name || id;
                console.log("Executing saved user script identifier:", identifier);
                const result = await this.codeExecutionService.executeScript(identifier, inputs);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.codeExecutionService =
            codeExecutionService || new code_execution_service_1.CodeExecutionService();
    }
}
exports.CodeExecutionController = CodeExecutionController;
