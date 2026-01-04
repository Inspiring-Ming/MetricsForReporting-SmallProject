import { Request, Response, NextFunction } from "express";
import { CodeExecutionService } from "../services/code-execution.service";

/**
 * Code Execution Controller
 * Handles HTTP requests for Python code validation, compilation, and execution
 */
export class CodeExecutionController {
  private codeExecutionService: CodeExecutionService;

  constructor(codeExecutionService?: CodeExecutionService) {
    this.codeExecutionService =
      codeExecutionService || new CodeExecutionService();
  }

  /**
   * POST /SAGE/code/validate
   * Validate Python code syntax
   */
  validateCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { language, code } = req.body || {};

      const result = await this.codeExecutionService.validatePythonCode(
        code,
        language
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /SAGE/code/submit
   * Submit and compile Python script
   */
  submitCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { language, code, name } = req.body || {};

      const result = await this.codeExecutionService.saveAndCompileScript(
        code,
        language,
        name
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /SAGE/code/execute
   * Execute saved Python script
   */
  executeCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id, script_name, inputs } = req.body || {};
      const identifier = script_name || id;

      console.log("Executing saved user script identifier:", identifier);

      const result = await this.codeExecutionService.executeScript(
        identifier,
        inputs
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
