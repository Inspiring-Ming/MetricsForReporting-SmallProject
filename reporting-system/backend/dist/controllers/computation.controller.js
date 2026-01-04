"use strict";
/**
 * Computation Controller
 * Handles HTTP requests for metric computation and model execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputationController = void 0;
const computation_service_1 = require("../services/computation.service");
class ComputationController {
    constructor() {
        /**
         * POST /SAGE/model/computation
         * Execute model computation with given metrics
         */
        this.executeModel = async (req, res, next) => {
            try {
                const { perm_id, calculation_type, year, metricArray } = req.body;
                const result = await this.computationService.executeModel(perm_id, calculation_type, year, metricArray);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.computationService = new computation_service_1.ComputationService();
    }
}
exports.ComputationController = ComputationController;
