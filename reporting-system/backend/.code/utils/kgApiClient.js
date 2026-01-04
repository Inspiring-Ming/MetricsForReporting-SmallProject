"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricCalculationMethod = getMetricCalculationMethod;
const http_errors_1 = __importDefault(require("http-errors"));
/**
 * ESG Knowledge Graph Platform API Client
 *
 * This client communicates with the esg-kg-platform backend API
 * to query the knowledge graph instead of directly querying GraphDB.
 */
const KG_API_BASE_URL = process.env.KG_API_URL || "http://localhost:3000/api/kg";
/**
 * Fetch helper with error handling
 */
async function fetchKGApi(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw (0, http_errors_1.default)(response.status, errorData.error?.message || `KG API request failed: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            throw error; // Re-throw HTTPError
        }
        throw (0, http_errors_1.default)(500, `Failed to connect to KG API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Get metric calculation method details
 * Used by modelExecutaion to fetch metric metadata
 *
 * @param metric - The metric identifier (label or IRI)
 * @returns Calculation method details including data sources or model information
 */
async function getMetricCalculationMethod(metric) {
    const encodedMetric = encodeURIComponent(metric);
    const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/calculation-method`;
    try {
        return await fetchKGApi(url);
    }
    catch (error) {
        throw (0, http_errors_1.default)(500, `Failed to get calculation method for ${metric}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
