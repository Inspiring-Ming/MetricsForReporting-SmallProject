"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapError = wrapError;
const http_errors_1 = __importDefault(require("http-errors"));
function wrapError(error) {
    // If the error is already an HTTPError, rethrow it
    if (error.statusCode)
        throw error;
    // Otherwise, it's an internal error
    throw (0, http_errors_1.default)(500, "Internal server error: ", error);
}
