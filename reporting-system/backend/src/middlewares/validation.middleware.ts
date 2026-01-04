import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors";

/**
 * Validation Middleware
 * Validates required query parameters
 */

/**
 * Validate query parameters exist
 */
export const validateQueryParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingParams = requiredParams.filter(
      (param) => !req.query[param]
    );

    if (missingParams.length > 0) {
      throw new ValidationError(
        `Missing required parameters: ${missingParams.join(", ")}`
      );
    }

    next();
  };
};

/**
 * Validate body parameters exist
 */
export const validateBodyParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingParams = requiredParams.filter(
      (param) => !req.body[param]
    );

    if (missingParams.length > 0) {
      throw new ValidationError(
        `Missing required parameters: ${missingParams.join(", ")}`
      );
    }

    next();
  };
};
