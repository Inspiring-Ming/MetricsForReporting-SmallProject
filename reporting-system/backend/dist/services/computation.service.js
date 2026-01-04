"use strict";
/**
 * Computation Service
 * Business logic for metric calculations and model execution
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputationService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const python_shell_1 = require("python-shell");
const dynamodb_repository_1 = require("../repositories/dynamodb.repository");
const errors_1 = require("../errors");
class ComputationService {
    constructor() {
        this.dynamoDBRepo = new dynamodb_repository_1.DynamoDBRepository();
    }
    /**
     * Execute model computation with given metrics
     */
    async executeModel(perm_id, calculation_type, year, metricArray) {
        if (metricArray.length < 1) {
            throw new errors_1.NotFoundError("Must be at least one input metric");
        }
        const metricValueArr = [];
        let pillar = undefined;
        // Clean metric names by removing esg: prefix if present
        const cleanMetricArray = metricArray.map((m) => this.removeIRIPrefix(m));
        // Get all metric calculation method details
        const metricCalcMethods = await Promise.all(cleanMetricArray.map(async (m) => {
            return await this.getMetricCalculationMethod(m);
        }));
        const metricInforArr = [];
        // Retrieve metric data from DynamoDB
        for (const metricCalcMethod of metricCalcMethods) {
            const metricLabel = metricCalcMethod.metric_label;
            // For direct measurement metrics, get the data source ID
            let metric_name;
            let sourceLabel;
            if (metricCalcMethod.calculation_method === "direct_measurement") {
                const firstDataSource = metricCalcMethod.data_sources?.[0];
                metric_name =
                    metricCalcMethod.attributes?.obtainedFrom ||
                        firstDataSource?.dataSourceID ||
                        metricLabel;
                sourceLabel = firstDataSource?.fileName || firstDataSource?.description;
            }
            else {
                // For calculation model metrics, use the metric label directly
                metric_name = metricLabel;
                sourceLabel = undefined;
            }
            const inputMetricData = await this.dynamoDBRepo.getMetric(perm_id, metric_name, year);
            const metricValue = inputMetricData.metric_value;
            if (metricValue === undefined || metricValue === null) {
                throw new errors_1.NotFoundError(`Metric ${metricLabel} doesn't have a reported value`);
            }
            const metricInfoObject = {
                metric_name: inputMetricData.metric_name ?? "No Data",
                value: metricValue,
                metric_type: inputMetricData.data_type ?? "No Data",
                unit: inputMetricData.metric_unit ?? "No Data",
                description: inputMetricData.metric_description ?? "No Data",
                provider: inputMetricData.provider_name ?? "No Data",
                source: sourceLabel ?? "No Data",
            };
            metricInforArr.push(metricInfoObject);
            // Ensures that all input metrics are the same kind (E, S or G)
            if (pillar !== undefined && pillar !== inputMetricData.pillar) {
                throw new errors_1.BadRequestError("All the input metrics must be the same pillar type");
            }
            pillar = inputMetricData.pillar;
            metricValueArr.push(metricValue.toString());
        }
        // Calculation
        const result = await this.handleComputationMethod(calculation_type, metricValueArr);
        const returnObj = {
            value: result,
            implementation: `${calculation_type}.py`,
            pillar: pillar,
            metricInfo: metricInforArr,
        };
        return returnObj;
    }
    /**
     * Handle computation method execution
     */
    async handleComputationMethod(calculation_type, metricArr) {
        const modelFolderPath = this.ensureFolder("models");
        let filePath;
        if (calculation_type.includes("models/")) {
            filePath = calculation_type;
        }
        else {
            filePath = path_1.default.join(modelFolderPath, `${calculation_type}.py`);
        }
        if (!fs_1.default.existsSync(filePath)) {
            throw new errors_1.NotFoundError(`Invalid or unimplemented model execution file: ${calculation_type}`);
        }
        try {
            // Run the model execution python script
            const model_output = await python_shell_1.PythonShell.run(filePath, {
                args: metricArr,
            });
            // output will be the array of stdout lines
            const data = JSON.parse(model_output.at(-1));
            return data.result;
        }
        catch (error) {
            throw new errors_1.InternalServerError(`Failed in execute the model ${calculation_type} python script: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Get metric calculation method from KG API
     */
    async getMetricCalculationMethod(metric) {
        const KG_API_BASE_URL = process.env.KG_API_URL || "http://localhost:3000/api/kg";
        const encodedMetric = encodeURIComponent(metric);
        const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/calculation-method`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({})));
                throw new errors_1.InternalServerError(errorData.error?.message || `KG API request failed: ${response.statusText}`);
            }
            return (await response.json());
        }
        catch (error) {
            if (error.statusCode) {
                throw error; // Re-throw custom error
            }
            throw new errors_1.InternalServerError(`Failed to connect to KG API: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Remove IRI prefix (esg:) from metric names
     */
    removeIRIPrefix(metricName) {
        if (metricName.startsWith("esg:")) {
            return metricName.substring(4);
        }
        return metricName;
    }
    /**
     * Ensure folder exists
     */
    ensureFolder(folderName) {
        const folderPath = path_1.default.join(process.cwd(), folderName);
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath);
        }
        return folderPath;
    }
}
exports.ComputationService = ComputationService;
