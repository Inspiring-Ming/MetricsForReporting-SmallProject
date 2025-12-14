"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genReportReq = genReportReq;
const axios_1 = __importDefault(require("axios"));
// ========================================================================= //
/**
 * Generall function for sending HTTP query for callout functions
 * @param {string} method
 * @param {string} server_url
 * @param {string | null} path
 * @param {object} payload
 * @param {string | null} token
 * @returns { Promise<Object> } Http_response
 */
async function requestHelper(method, server_url, path, payload, token) {
    // Path is optional for multi functional path on a server
    const url = server_url + (path ?? "");
    const options = {
        method,
        url: url,
        headers: token ? { token } : {},
        params: ["GET", "DELETE"].includes(method) ? payload : {}, // Query params
        data: ["POST", "PUT"].includes(method) ? payload : {}, // Body data
    };
    try {
        const res = await (0, axios_1.default)(options);
        return res.data; // Return response data
    }
    catch (error) {
        // Return status code and its message on failure
        const errorObj = {
            statusCode: error.response?.status || 500,
            message: error.response?.data.error || "Internal Error"
        };
        console.log(errorObj); // Debug line
        return errorObj;
    }
}
// Example Server URL, replace with actual config if needed
const host = "http://localhost";
const port = 3001;
const SERVER_URL = `${host}:${port}`;
// Example function for calling another service
async function genReportReq() {
    return await requestHelper("GET", SERVER_URL, "/SAGE/echo", {});
}
