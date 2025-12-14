import fs from "fs";
import path from "path";
import { PythonShell } from "python-shell";

import { getMetricCalculationMethod } from "../utils/kgApiClient";
import { getMetric } from "../dynamoDB/dynamoDBHandler";
import HTTPError from "http-errors";
import { wrapError } from "../utils/generalHelper";

// CQ8: What are the historical Values of [specific datapoint]?
async function getMetricValue(
  perm_id: string,
  metric_name: string,
  year: string
): Promise<any>
{
  const metricAtr = await getMetric(perm_id, metric_name, year);
  return {
    value: metricAtr.metric_value,
    pillar: metricAtr.pillar,
    reported_date: metricAtr.reported_date ?? "",
  };
}

interface modelExecutionReturn {
  value: number,
  implementation: string,
  pillar: string,
  metricInfo: any[],
}

/**
 * Helper function to remove IRI prefix (esg:) from metric names
 * @param metricName - Metric name that might have esg: prefix
 * @returns Clean metric name without prefix
 */
function removeIRIPrefix(metricName: string): string {
  if (metricName.startsWith('esg:')) {
    return metricName.substring(4);
  }
  return metricName;
}

async function modelExecutaion(
  perm_id: string,
  calculation_type: string,
  year: string,
  metricArray: string[]
): Promise<modelExecutionReturn>
{
  if (metricArray.length < 1) {
    throw HTTPError(404, "Must be at least one input metric");
  }

  const metricValueArr: string[] = [];

  let pillar: string | undefined = undefined;

  try {
    // Clean metric names by removing esg: prefix if present
    const cleanMetricArray = metricArray.map(m => removeIRIPrefix(m));
    
    // Get all metric calculation method details
    const metricCalcMethods = await Promise.all(
      cleanMetricArray.map(async (m) => {
        return await getMetricCalculationMethod(m);
      })
    );

    const metricInforArr = [];

    // Retrieve metric data from DynamoDB
    for (const metricCalcMethod of metricCalcMethods) {
      const metricLabel = metricCalcMethod.metric_label;
      
      // For direct measurement metrics, get the data source ID
      let metric_name: string;
      let sourceLabel: string | undefined;
      
      if (metricCalcMethod.calculation_method === 'direct_measurement') {
        const firstDataSource = metricCalcMethod.data_sources?.[0];
        metric_name = metricCalcMethod.attributes?.obtainedFrom || firstDataSource?.dataSourceID || metricLabel;
        sourceLabel = firstDataSource?.fileName || firstDataSource?.description;
      } else {
        // For calculation model metrics, use the metric label directly
        metric_name = metricLabel;
        sourceLabel = undefined;
      }

      const inputMetricData = await getMetric(perm_id, metric_name, year);

      const metricValue = inputMetricData.metric_value;
      if (metricValue === undefined || metricValue === null) {
        throw HTTPError(404, `Metric ${metricLabel} doesn't have a reported value`);
      }

      const metricInfoObject = {
        metric_name: inputMetricData.metric_name?? "No Data",
        value: metricValue,
        metric_type: inputMetricData.data_type?? "No Data",
        unit: inputMetricData.metric_unit?? "No Data",
        description: inputMetricData.metric_description?? "No Data",
        provider: inputMetricData.provider_name?? "No Data",
        source: sourceLabel?? "No Data",
      };

      metricInforArr.push(metricInfoObject);

      // Ensures that all input metrics are the same kind (E, S or G)
      if (pillar !== undefined && pillar !== inputMetricData.pillar) {
        throw HTTPError(400, "All the input metrics must be the same pillar type");
      }

      pillar = inputMetricData.pillar;

      metricValueArr.push(metricValue.toString());
    }

    // Calculation
    const result: number = await handleComputationMethod(calculation_type, metricValueArr);

    const returnObj: modelExecutionReturn = {
      value: result,
      implementation: `${calculation_type}.py`,
      pillar: pillar,
      metricInfo: metricInforArr,
    };

    return returnObj;

  } catch (error) {
    wrapError(error);
  }
}

async function handleComputationMethod(
  calculation_type: string,
  metricArr: string[],
): Promise<number>
{

  const modelFolderPath = isFolder("models");
  let filePath;

  if (calculation_type.includes("models/")) {
    filePath = calculation_type;
  } else {
    filePath = path.join(modelFolderPath, `${calculation_type}.py`);
  }

  if (!fs.existsSync(filePath)) {
    throw HTTPError(404, `Invalid or unimplemented model execution file: ${calculation_type}`);
  }

  try {
    // Run the model execution python script
    const model_output = await PythonShell.run(filePath, {
      args: metricArr
    });

    // output will be the array of stdout lines
    const data = JSON.parse(model_output.at(-1)!);

    return data.result;
  } catch (error) {
    throw HTTPError(500, `Failed in execute the model ${calculation_type} python script: `, error);
  };

}

function isFolder(folderName: string) {
  const folderPath = path.join(process.cwd(), folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
  return folderPath;
}

export {
  getMetricValue,
  modelExecutaion,
};
