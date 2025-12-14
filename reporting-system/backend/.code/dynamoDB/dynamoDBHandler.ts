import HTTPError from "http-errors";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient,
  GetCommand,QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import { wrapError } from "../utils/generalHelper";
import { MappedRecord } from "../interface/interface";
import dotenv from "dotenv";
dotenv.config();

process.env.AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY;
const dynamoDBClient = new DynamoDBClient({
  region: "ap-southeast-2",
});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const tableName = "ESG-Metrics-Data";

async function getMetric(perm_id: string, metric_name: string, year: string)
: Promise<MappedRecord>
{
  // Partition key of DynamoDB
  const pk = `COMP#${perm_id}`;
  // Sort key
  const sk = `YEAR#${year}#METRIC#${metric_name}`;

  const cmd = new GetCommand({
    TableName: tableName,
    Key: { PK: pk, SK: sk },
  });

  try {
    const res = await docClient.send(cmd);

    if (!res.Item) {
      console.log(`No data for "${metric_name}" of perm id "${perm_id}" in the "${year}"`);
      throw HTTPError(404, `No data for "${metric_name}" of perm id "${perm_id}" in the "${year}"`);
    }

    return res.Item as MappedRecord;
  } catch (error) {
    wrapError(error);
  }
}

async function getCompanyIndustry(perm_id: string)
: Promise< { industry: string, company_name: string } >
{
  // Partition key of DynamoDB
  const pk = `COMP#${perm_id}`;

  const cmd = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": pk },
    ProjectionExpression: "industry, company_name",
    Limit: 1,
  });

  try {
    const res = await docClient.send(cmd);

    if (res.Items && res.Items.length > 0) {
      const item = res.Items[0] as { industry?: string, company_name?: string };

      if (!item.industry) {
        throw HTTPError(500, `❌ No industry field for perm id "${perm_id}" on metric(s) DynamoDB.`);
      }

      if (!item.company_name) {
        throw HTTPError(500, `❌ No company_name field for perm id "${perm_id}" on metric(s) DynamoDB.`);
      }

      return { industry: item.industry, company_name: item.company_name };
    } else {
      console.log(`❌ No industry found for the given company perm id: "${perm_id}".`);
      throw HTTPError(404, `❌ No industry found for the given company perm id: "${perm_id}".`);
    }

  } catch (err) {
    console.error("❌ Error querying industry:", err);
    wrapError(err);
  }
}

export { getMetric, getCompanyIndustry };
