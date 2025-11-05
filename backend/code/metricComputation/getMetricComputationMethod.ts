import fs from "fs";
import path from "path";
import { PythonShell } from "python-shell";

import {
  getMetricAtributes, getDataPointAtribute,
  getDataSourceInfo,
} from "../KG/queryGraph";
import { getMetric } from "../dynamoDB/dynamoDBHandler";
import HTTPError from "http-errors";
import { wrapError } from "../utils/generalHelper";

/**
 * CQ5:How is the value of [specific metric] calculated or directly measured?
 *
 * @param {string} metric_label
 * @returns
 */
async function getMetricComputationMethod(metric_label: string) {
  const metricAtrMap = await getMetricAtributes(metric_label);

  const computationMethod = metricAtrMap.get("hasCalculationMethod");

  if (!computationMethod) {
    throw HTTPError(404, `Metric ${metric_label} don't have a calculation method`);
  }

  switch (computationMethod) {
  case "calculation_model":
  {
    const model = metricAtrMap.get("isCalculatedBy");
    // console.log(modelList); // For later multiple model for one metric computation
    const modelAtr = await getDataPointAtribute(model);

    const requiredInputs = modelAtr.get("requiresInputFrom");
    if (!requiredInputs) {
      throw HTTPError(404, `Model "${modelAtr.get("label")}" does not have "requiresInputFrom"`);
    }

    let requiredInputArr: string[] = [];
    if (requiredInputs.includes(",")) {
      requiredInputArr = requiredInputs.split(", ");
    } else {
      requiredInputArr.push(requiredInputs);
    }

    const returnObj = {
      measureMethod: "calculation_model",
      isCalculatedBy: modelAtr.get("label"),
      hasCalculationType: modelAtr.get("hasCalculationType"),
      hasFormula: modelAtr.get("hasMathematicalExpression"),
      requiresInputFrom: requiredInputArr,
    };

    console.log(returnObj);

    return returnObj;
  }

  case "direct_measurement":
  {
    const dataPoint =  metricAtrMap.get("obtainedFrom");
    const dataPointAtr = await getDataPointAtribute(dataPoint);
    const source = dataPointAtr.get("sourceFrom");
    const sourceLabel = await getDataSourceInfo(source);

    const returnObj = {
      measureMethod: "direct_measurement",
      obtainedFrom: dataPointAtr.get("label"),
      source: sourceLabel,
    };

    return returnObj;
  }

  default:
  {
    throw HTTPError(404, `Unrecognized computation method: "${computationMethod}" of "${metric_label}" `);
  }
  }
}

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

  console.log("metricArray:", metricArray);

  const metricValueArr: string[] = [];

  let pillar: string | undefined = undefined;

  try {
    // Get all metric atribute
    const metricAtrArrMap: Map<string, string>[] = await Promise.all(
      metricArray.map(async (m) => {
        const data = await getDataPointAtribute(m);
        return data;
      })
    );

    console.log("metricAtrArrMap:", metricAtrArrMap);

    const metricInforArr = [];

    // Retreive metric data from DynamoDB
    for (const metric of metricAtrArrMap) {
      const dataset_acess_var = metric.get("obtainedFrom");
      if (!dataset_acess_var) {
        throw HTTPError(404, `Metric ${metric.get("label")?? JSON.stringify([...metric])} doesn't have an obtained method`);
      }

      const inputMetricAtr = await getDataPointAtribute(dataset_acess_var);

      const metric_name = inputMetricAtr.get("label") ?? dataset_acess_var;

      const inputMetricData = await getMetric(perm_id, metric_name, year);

      const metricValue = inputMetricData.metric_value;
      if (metricValue === undefined || metricValue === null) {
        throw HTTPError(404, `Metric ${JSON.stringify([...metric])} doesn't have a reported value`);
      }

      const source = inputMetricAtr.get("sourceFrom");
      const sourceLabel = await getDataSourceInfo(source);

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
  const filePath = path.join(modelFolderPath, `${calculation_type}.py`);

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
  getMetricComputationMethod,
  getMetricValue,
  modelExecutaion,
};
