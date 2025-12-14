import HTTPError from "http-errors";

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
async function fetchKGApi(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw HTTPError(
        response.status,
        errorData.error?.message || `KG API request failed: ${response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error: any) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error; // Re-throw HTTPError
    }
    throw HTTPError(500, `Failed to connect to KG API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all the metric's attributes by metric label
 * 
 * @param metric_label - The label of the metric (e.g., "Total Energy Consumed")
 * @returns Map of attribute key-value pairs
 */
export async function getMetricAtributes(metric_label: string): Promise<Map<string, string>> {
  const encodedLabel = encodeURIComponent(metric_label);
  // Use the new metrics/:id endpoint instead of deprecated attributes endpoint
  const url = `${KG_API_BASE_URL}/metrics/${encodedLabel}`;
  
  try {
    const data = await fetchKGApi(url);
    
    // Extract attributes from the new response format
    if (data.result && data.result.attributes && typeof data.result.attributes === 'object') {
      return new Map(Object.entries(data.result.attributes));
    }
    
    return new Map<string, string>();
  } catch (error) {
    throw HTTPError(500, `Failed to get attributes for metric ${metric_label}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get metric calculation method details (New API)
 * 
 * @param metric - The metric identifier (label or IRI)
 * @returns Calculation method details including data sources or model information
 */
export async function getMetricCalculationMethod(metric: string): Promise<any> {
  const encodedMetric = encodeURIComponent(metric);
  const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/calculation-method`;
  
  try {
    return await fetchKGApi(url);
  } catch (error) {
    throw HTTPError(500, `Failed to get calculation method for ${metric}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get metric inputs for calculation model metrics (New API)
 * 
 * @param metric - The metric identifier (label or IRI)
 * @returns List of input metrics with their details
 */
export async function getMetricInputs(metric: string): Promise<any> {
  const encodedMetric = encodeURIComponent(metric);
  const url = `${KG_API_BASE_URL}/metrics/${encodedMetric}/inputs`;
  
  try {
    return await fetchKGApi(url);
  } catch (error) {
    throw HTTPError(500, `Failed to get inputs for ${metric}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * @deprecated Use getMetricCalculationMethod() instead. This endpoint will be removed in v2.0.0 (June 2026)
 * Get data point attributes (for DatasetVariable or other entities)
 * 
 * @param metric - The metric identifier (e.g., "ENERGYUSETOTAL")
 * @returns Map of attribute key-value pairs
 */
export async function getDataPointAtribute(metric: string): Promise<Map<string, string>> {
  const encodedMetric = encodeURIComponent(metric);
  const url = `${KG_API_BASE_URL}/datapoints/attributes?metric=${encodedMetric}`;
  
  try {
    const data = await fetchKGApi(url);
    
    // Convert the response object to Map
    if (data.attributes && typeof data.attributes === 'object') {
      return new Map(Object.entries(data.attributes));
    }
    
    return new Map<string, string>();
  } catch (error) {
    throw HTTPError(500, `Failed to get data point attributes for ${metric}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get data source information (label)
 * 
 * @param source - The source identifier (e.g., "SemiconductorsEurofidaiEnvironmentDataset")
 * @returns The label of the data source, or undefined if not found
 */
export async function getDataSourceInfo(source: string): Promise<string | undefined> {
  // Return undefined if source is empty or undefined
  if (!source || source.trim() === '') {
    return undefined;
  }
  
  const encodedSource = encodeURIComponent(source);
  const url = `${KG_API_BASE_URL}/datasource?source=${encodedSource}`;
  
  try {
    const data = await fetchKGApi(url);
    
    // Return the info field (which contains the label)
    return data.info || undefined;
  } catch (error) {
    // If source not found, return undefined instead of throwing
    if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404) {
      return undefined;
    }
    throw HTTPError(404, `Failed to retrieve source of node ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
