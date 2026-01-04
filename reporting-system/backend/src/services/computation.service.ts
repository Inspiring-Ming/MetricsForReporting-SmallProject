/**
 * Computation Service
 * Business logic for metric calculations and model execution
 */

import fs from "fs";
import path from "path";
import { PythonShell } from "python-shell";
import { ModelExecutionResult, MetricCalculationMethod, MetricInfo } from "../models/computation.model";
import { DynamoDBRepository } from "../repositories/dynamodb.repository";
import { NotFoundError, BadRequestError, InternalServerError } from "../errors";

export class ComputationService {
  private dynamoDBRepo: DynamoDBRepository;

  constructor() {
    this.dynamoDBRepo = new DynamoDBRepository();
  }

  /**
   * Execute model computation with given metrics
   */
  async executeModel(
    perm_id: string,
    calculation_type: string,
    year: string,
    metricArray: string[]
  ): Promise<ModelExecutionResult> {
    if (metricArray.length < 1) {
      throw new NotFoundError("Must be at least one input metric");
    }

    const metricValueArr: string[] = [];
    let pillar: string | undefined = undefined;

    // Clean metric names by removing esg: prefix if present
    const cleanMetricArray = metricArray.map((m) => this.removeIRIPrefix(m));

    // Get all metric calculation method details
    const metricCalcMethods = await Promise.all(
      cleanMetricArray.map(async (m) => {
        return await this.getMetricCalculationMethod(m);
      })
    );

    const metricInforArr: MetricInfo[] = [];

    // Retrieve metric data from DynamoDB
    for (const metricCalcMethod of metricCalcMethods) {
      const metricLabel = metricCalcMethod.metric_label;

      // For direct measurement metrics, get the data source ID
      let metric_name: string;
      let sourceLabel: string | undefined;

      if (metricCalcMethod.calculation_method === "direct_measurement") {
        const firstDataSource = metricCalcMethod.data_sources?.[0];
        metric_name =
          metricCalcMethod.attributes?.obtainedFrom ||
          firstDataSource?.dataSourceID ||
          metricLabel;
        sourceLabel = firstDataSource?.fileName || firstDataSource?.description;
      } else {
        // For calculation model metrics, use the metric label directly
        metric_name = metricLabel;
        sourceLabel = undefined;
      }

      const inputMetricData = await this.dynamoDBRepo.getMetric(perm_id, metric_name, year);

      const metricValue = inputMetricData.metric_value;
      if (metricValue === undefined || metricValue === null) {
        throw new NotFoundError(`Metric ${metricLabel} doesn't have a reported value`);
      }

      const metricInfoObject: MetricInfo = {
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
        throw new BadRequestError("All the input metrics must be the same pillar type");
      }

      pillar = inputMetricData.pillar;

      metricValueArr.push(metricValue.toString());
    }

    // Calculation
    const result: number = await this.handleComputationMethod(
      calculation_type,
      metricValueArr
    );

    const returnObj: ModelExecutionResult = {
      value: result,
      implementation: `${calculation_type}.py`,
      pillar: pillar!,
      metricInfo: metricInforArr,
    };

    return returnObj;
  }

  /**
   * Handle computation method execution
   */
  private async handleComputationMethod(
    calculation_type: string,
    metricArr: string[]
  ): Promise<number> {
    const modelFolderPath = this.ensureFolder("models");
    let filePath: string;

    if (calculation_type.includes("models/")) {
      filePath = calculation_type;
    } else {
      filePath = path.join(modelFolderPath, `${calculation_type}.py`);
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(
        `Invalid or unimplemented model execution file: ${calculation_type}`
      );
    }

    try {
      // Run the model execution python script
      const model_output = await PythonShell.run(filePath, {
        args: metricArr,
      });

      // output will be the array of stdout lines
      const data = JSON.parse(model_output.at(-1)!);

      return data.result;
    } catch (error) {
      throw new InternalServerError(
        `Failed in execute the model ${calculation_type} python script: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get metric calculation method from KG API
   */
  private async getMetricCalculationMethod(metric: string): Promise<MetricCalculationMethod> {
    const KG_API_BASE_URL = process.env.KG_API_URL || "http://localhost:3000/api/kg";
    const encodedMetric = encodeURIComponent(metric);
    const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/calculation-method`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new InternalServerError(
          errorData.error?.message || `KG API request failed: ${response.statusText}`
        );
      }

      return (await response.json()) as MetricCalculationMethod;
    } catch (error: any) {
      if (error.statusCode) {
        throw error; // Re-throw custom error
      }
      throw new InternalServerError(
        `Failed to connect to KG API: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Remove IRI prefix (esg:) from metric names
   */
  private removeIRIPrefix(metricName: string): string {
    if (metricName.startsWith("esg:")) {
      return metricName.substring(4);
    }
    return metricName;
  }

  /**
   * Ensure folder exists
   */
  private ensureFolder(folderName: string): string {
    const folderPath = path.join(process.cwd(), folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    return folderPath;
  }
}
