/**
 * Computation Controller
 * Handles HTTP requests for metric computation and model execution
 */

import { Request, Response, NextFunction } from "express";
import { ComputationService } from "../services/computation.service";

export class ComputationController {
  private computationService: ComputationService;

  constructor() {
    this.computationService = new ComputationService();
  }

  /**
   * POST /SAGE/model/computation
   * Execute model computation with given metrics
   */
  executeModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { perm_id, calculation_type, year, metricArray } = req.body;

      const result = await this.computationService.executeModel(
        perm_id,
        calculation_type,
        year,
        metricArray
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
