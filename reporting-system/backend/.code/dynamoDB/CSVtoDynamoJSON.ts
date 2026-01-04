import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { MappedRecord } from "../interface/interface";

// Translate atribute into DynamoDB JSON atribute format
function toDynamoAttr(value: any): any {
  if (value === "" || value === null || value === undefined) {
    return { NULL: true };
  }
  if (!isNaN(value) && value !== "") {
    return { N: String(value) };
  }
  return { S: String(value) };
}

// Extract year from "YYYY-MM-DD"
function extractYear(date: string): string {
  return date?.split("-")[0] || "";
}

const inputPath = path.join(process.cwd(), "data", "Raw_data_with_industry.csv");
const outputPath = path.join(process.cwd(), "data/output", "dynamodb_import.json");

const writeStream = fs.createWriteStream(outputPath, { flags: "w" });

let count = 0;

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    try {
      const year = extractYear(row["metric_year"]);

      const record: MappedRecord = {
        PK: toDynamoAttr(`COMP#${row["perm_id"]}`),
        SK: toDynamoAttr(`YEAR#${year}#METRIC#${row["metric_name"]}`),
        company_name: toDynamoAttr(row["company_name"] || row["Company_Name"]),
        data_type: toDynamoAttr(row["data_type"]),
        disclosure: toDynamoAttr(row["disclosure"]),
        metric_description: toDynamoAttr(row["metric_description"]),
        metric_name: toDynamoAttr(row["metric_name"]),
        metric_unit: toDynamoAttr(row["metric_unit"]),
        metric_value: toDynamoAttr(row["metric_value"]),
        metric_year: toDynamoAttr(year),
        nb_points_of_observations: toDynamoAttr(row["nb_points_of_observations"]),
        metric_period: toDynamoAttr(row["metric_period"]),
        provider_name: toDynamoAttr(row["provider_name"]),
        reported_date: toDynamoAttr(row["reported_date"]),
        pillar: toDynamoAttr(row["pillar"]),
        headquarter_country: toDynamoAttr(row["headquarter_country"]),
        industry: toDynamoAttr(row["industry"]),
      };

      // Wrap the record inside Item object
      writeStream.write(JSON.stringify({ Item: record }) + "\n");
      count++;
      if (count % 10000 === 0) console.log(`✔️ Processed ${count} records`);
    } catch (err) {
      console.error("❌ Error processing row:", err);
    }
  })
  .on("end", () => {
    writeStream.end();
    console.log(`🎉 Done. Exported ${count} records to ${outputPath}`);
  });
