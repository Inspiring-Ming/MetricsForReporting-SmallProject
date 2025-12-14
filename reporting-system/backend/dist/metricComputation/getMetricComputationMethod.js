"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricComputationMethod = getMetricComputationMethod;
exports.getMetricValue = getMetricValue;
exports.modelExecutaion = modelExecutaion;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const python_shell_1 = require("python-shell");
const kgApiClient_1 = require("../utils/kgApiClient");
const dynamoDBHandler_1 = require("../dynamoDB/dynamoDBHandler");
const http_errors_1 = __importDefault(require("http-errors"));
const generalHelper_1 = require("../utils/generalHelper");
/**
 * CQ5:How is the value of [specific metric] calculated or directly measured?
 *
 * @param {string} metric_label
 * @returns
 */
async function getMetricComputationMethod(metric_label) {
    const metricAtrMap = await (0, kgApiClient_1.getMetricAtributes)(metric_label);
    const computationMethod = metricAtrMap.get("hasCalculationMethod");
    if (!computationMethod) {
        throw (0, http_errors_1.default)(404, `Metric ${metric_label} don't have a calculation method`);
    }
    switch (computationMethod) {
        case "calculation_model":
            {
                // Use new API to get calculation method details
                const calcMethodData = await (0, kgApiClient_1.getMetricCalculationMethod)(metric_label);
                if (!calcMethodData.model) {
                    throw (0, http_errors_1.default)(404, `Metric "${metric_label}" does not have a model association`);
                }
                // Get input metrics using new API
                const inputsData = await (0, kgApiClient_1.getMetricInputs)(metric_label);
                const requiredInputArr = inputsData.inputs.map((input) => input.label || input.iri);
                // Use implementation filePath as calculationType for backward compatibility
                // Priority: implementation.filePath > model.calculationType > "calculation_model"
                const calculationType = calcMethodData.implementation?.filePath
                    || calcMethodData.model.calculationType
                    || "calculation_model";
                const returnObj = {
                    measureMethod: "calculation_model",
                    isCalculatedBy: calcMethodData.model.label,
                    hasCalculationType: calculationType,
                    executesWith: calcMethodData.implementation?.filePath || calcMethodData.implementation?.label,
                    hasFormula: calcMethodData.model.mathematicalExpression || calcMethodData.model.formula,
                    requiresInputFrom: requiredInputArr,
                };
                console.log(returnObj);
                return returnObj;
            }
        case "direct_measurement":
            {
                // Use new API to get calculation method details
                const calcMethodData = await (0, kgApiClient_1.getMetricCalculationMethod)(metric_label);
                // Extract data source information
                const firstDataSource = calcMethodData.data_sources?.[0];
                const obtainedFrom = calcMethodData.attributes?.obtainedFrom || firstDataSource?.dataSourceID || metric_label;
                const source = firstDataSource?.fileName || firstDataSource?.description;
                const returnObj = {
                    measureMethod: "direct_measurement",
                    obtainedFrom: obtainedFrom,
                    source: source,
                };
                return returnObj;
            }
        default:
            {
                throw (0, http_errors_1.default)(404, `Unrecognized computation method: "${computationMethod}" of "${metric_label}" `);
            }
    }
}
// CQ8: What are the historical Values of [specific datapoint]?
async function getMetricValue(perm_id, metric_name, year) {
    const metricAtr = await (0, dynamoDBHandler_1.getMetric)(perm_id, metric_name, year);
    return {
        value: metricAtr.metric_value,
        pillar: metricAtr.pillar,
        reported_date: metricAtr.reported_date ?? "",
    };
}
/**
 * Helper function to remove IRI prefix (esg:) from metric names
 * @param metricName - Metric name that might have esg: prefix
 * @returns Clean metric name without prefix
 */
function removeIRIPrefix(metricName) {
    if (metricName.startsWith('esg:')) {
        return metricName.substring(4);
    }
    return metricName;
}
async function modelExecutaion(perm_id, calculation_type, year, metricArray) {
    if (metricArray.length < 1) {
        throw (0, http_errors_1.default)(404, "Must be at least one input metric");
    }
    const metricValueArr = [];
    let pillar = undefined;
    try {
        // Clean metric names by removing esg: prefix if present
        const cleanMetricArray = metricArray.map(m => removeIRIPrefix(m));
        // Get all metric calculation method details
        const metricCalcMethods = await Promise.all(cleanMetricArray.map(async (m) => {
            return await (0, kgApiClient_1.getMetricCalculationMethod)(m);
        }));
        const metricInforArr = [];
        // Retrieve metric data from DynamoDB
        for (const metricCalcMethod of metricCalcMethods) {
            const metricLabel = metricCalcMethod.metric_label;
            // For direct measurement metrics, get the data source ID
            let metric_name;
            let sourceLabel;
            if (metricCalcMethod.calculation_method === 'direct_measurement') {
                const firstDataSource = metricCalcMethod.data_sources?.[0];
                metric_name = metricCalcMethod.attributes?.obtainedFrom || firstDataSource?.dataSourceID || metricLabel;
                sourceLabel = firstDataSource?.fileName || firstDataSource?.description;
            }
            else {
                // For calculation model metrics, use the metric label directly
                metric_name = metricLabel;
                sourceLabel = undefined;
            }
            const inputMetricData = await (0, dynamoDBHandler_1.getMetric)(perm_id, metric_name, year);
            const metricValue = inputMetricData.metric_value;
            if (metricValue === undefined || metricValue === null) {
                throw (0, http_errors_1.default)(404, `Metric ${metricLabel} doesn't have a reported value`);
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
                throw (0, http_errors_1.default)(400, "All the input metrics must be the same pillar type");
            }
            pillar = inputMetricData.pillar;
            metricValueArr.push(metricValue.toString());
        }
        // Calculation
        const result = await handleComputationMethod(calculation_type, metricValueArr);
        const returnObj = {
            value: result,
            implementation: `${calculation_type}.py`,
            pillar: pillar,
            metricInfo: metricInforArr,
        };
        return returnObj;
    }
    catch (error) {
        (0, generalHelper_1.wrapError)(error);
    }
}
async function handleComputationMethod(calculation_type, metricArr) {
    const modelFolderPath = isFolder("models");
    let filePath;
    if (calculation_type.includes("models/")) {
        filePath = calculation_type;
    }
    else {
        filePath = path_1.default.join(modelFolderPath, `${calculation_type}.py`);
    }
    if (!fs_1.default.existsSync(filePath)) {
        throw (0, http_errors_1.default)(404, `Invalid or unimplemented model execution file: ${calculation_type}`);
    }
    try {
        // Run the model execution python script
        const model_output = await python_shell_1.PythonShell.run(filePath, {
            args: metricArr
        });
        // output will be the array of stdout lines
        const data = JSON.parse(model_output.at(-1));
        return data.result;
    }
    catch (error) {
        throw (0, http_errors_1.default)(500, `Failed in execute the model ${calculation_type} python script: `, error);
    }
    ;
}
function isFolder(folderName) {
    const folderPath = path_1.default.join(process.cwd(), folderName);
    if (!fs_1.default.existsSync(folderPath)) {
        fs_1.default.mkdirSync(folderPath);
    }
    return folderPath;
}
