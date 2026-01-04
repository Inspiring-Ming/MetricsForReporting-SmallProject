"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetric = getMetric;
exports.getCompanyIndustry = getCompanyIndustry;
const http_errors_1 = __importDefault(require("http-errors"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const generalHelper_1 = require("../utils/generalHelper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
process.env.AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY;
const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({
    region: "ap-southeast-2",
});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoDBClient);
const tableName = "ESG-Metrics-Data";
async function getMetric(perm_id, metric_name, year) {
    // Partition key of DynamoDB
    const pk = `COMP#${perm_id}`;
    // Sort key
    const sk = `YEAR#${year}#METRIC#${metric_name}`;
    const cmd = new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
    });
    try {
        const res = await docClient.send(cmd);
        if (!res.Item) {
            console.log(`No data for "${metric_name}" of perm id "${perm_id}" in the "${year}"`);
            throw (0, http_errors_1.default)(404, `No data for "${metric_name}" of perm id "${perm_id}" in the "${year}"`);
        }
        return res.Item;
    }
    catch (error) {
        (0, generalHelper_1.wrapError)(error);
    }
}
async function getCompanyIndustry(perm_id) {
    // Partition key of DynamoDB
    const pk = `COMP#${perm_id}`;
    const cmd = new lib_dynamodb_1.QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        ProjectionExpression: "industry, company_name",
        Limit: 1,
    });
    try {
        const res = await docClient.send(cmd);
        if (res.Items && res.Items.length > 0) {
            const item = res.Items[0];
            if (!item.industry) {
                throw (0, http_errors_1.default)(500, `❌ No industry field for perm id "${perm_id}" on metric(s) DynamoDB.`);
            }
            if (!item.company_name) {
                throw (0, http_errors_1.default)(500, `❌ No company_name field for perm id "${perm_id}" on metric(s) DynamoDB.`);
            }
            return { industry: item.industry, company_name: item.company_name };
        }
        else {
            console.log(`❌ No industry found for the given company perm id: "${perm_id}".`);
            throw (0, http_errors_1.default)(404, `❌ No industry found for the given company perm id: "${perm_id}".`);
        }
    }
    catch (err) {
        console.error("❌ Error querying industry:", err);
        (0, generalHelper_1.wrapError)(err);
    }
}
