import HTTPError from "http-errors";
import dotenv from "dotenv";
dotenv.config();

// GraphDB Configuration
const GRAPHDB_BASE_URL = process.env.GRAPHDB_URL || "localhost:7200";
const REPOSITORY_ID = process.env.GRAPHDB_REPOSITORY || "esg-knowledge-graph";
const GRAPHDB_ENDPOINT = `${GRAPHDB_BASE_URL}/repositories/${REPOSITORY_ID}`;

// Global KG's Prefix
const ESG = "PREFIX esg: <http://example.org/esg#>";
const RDFS = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>";

// GraphDB SPARQL Query Function
async function executeSparqlQuery(query: string): Promise<any> {
  try {
    const response = await fetch(GRAPHDB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json"
      },
      body: query
    });

    if (!response.ok) {
      throw new Error(`GraphDB query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw HTTPError(500, `GraphDB query failed: ${error}`);
  }
}

async function getReportFramework(industry: string) {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?frameworkLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label ?frameworkLabel ;
    }
    ORDER BY ?frameworkLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.frameworkLabel && binding.frameworkLabel.value) {
          res.push(binding.frameworkLabel.value);
        }
      }
    }

    return { result: res };
  } catch {
    throw HTTPError(500, `Failed to get report framework for industry ${industry}`);
  }
}

/**
 * CQ3: What Categories are included within the [reporting framework]?
 *
 * @param {string} industry
 * @param {string} framework
 * @returns { Promise<{ categoryUri: string; categoryLabel: string }[]> }
 */
async function getCategoriesByIndustryAndReportFramework(
  industry: string,
  framework: string
): Promise<{ result: string[] }>
{
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?category ?categoryLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label "${framework}" ;
                 esg:includes ?category .
      ?category a esg:Category ;
                rdfs:label ?categoryLabel .
    }
    ORDER BY ?categoryLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.categoryLabel && binding.categoryLabel.value) {
          res.push(binding.categoryLabel.value);
        }
      }
    }

    return { result: res };
  } catch {
    throw HTTPError(500, `Failed to get categories for industry ${industry} and framework ${framework}`);
  }
}

/**
 * CQ4: Which Metrics are classified under [specific category]?
 *
 * @param industry
 * @param categoryLabel
 * @returns {Promise<{ metricUri: string; metricLabel: string }[]>}
 */
async function getMetricsByIndustryAndCategory(
  industry: string,
  categoryLabel: string,
  framework: string
): Promise<{ result: string[] }>
{

  // SPARQL query with parameterized category
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?metric ?metricLabel WHERE {
      ?industry a esg:Industry ;
                rdfs:label "${industry}" ;
                esg:reportsUsing ?framework .

      ?framework a esg:ReportingFramework ;
                 rdfs:label "${framework}" ;
                 esg:includes ?category .

      ?category a esg:Category ;
                rdfs:label "${categoryLabel}" ;
                esg:consistsOf ?metric .

      ?metric a esg:Metric ;
              rdfs:label ?metricLabel .
    }
    ORDER BY ?metricLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const res: string[] = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.metricLabel && binding.metricLabel.value) {
          res.push(binding.metricLabel.value);
        }
      }
    }

    return { result: res };
  } catch {
    throw HTTPError(500, `Failed to get metrics for industry ${industry}, category ${categoryLabel}, framework ${framework}`);
  }
}

// Helper function to convert GraphDB bindings to Map
function createDataMapFromGraphDB(bindings: any[]): Map<string, string> {
  const dataMap = new Map<string, string>();

  bindings.forEach(binding => {
    const p = binding.p?.value;
    const o = binding.o?.value;

    if (p && o) {
      // Get rid of IRIs
      const predicate = removeIRI(p);
      const object = removeIRI(o);

      // Add more object if predicate already exist
      if (dataMap.has(predicate)) {
        const current = dataMap.get(predicate)!;
        dataMap.set(predicate, `${current}, ${object}`);
      } else {
        dataMap.set(predicate, object);
      }
    }
  });

  return dataMap;
}

/**
 * Get all the metric's atributes
 *
 * @param metric_label
 * @returns
 */
async function getMetricAtributes(metric_label: string)
: Promise<Map<string, string>>
{
  const query = `
    ${ESG}
    ${RDFS}
    SELECT ?p ?o WHERE {
      ?metric a esg:Metric ;
              rdfs:label "${metric_label}" ;
              ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);

    if (result.results && result.results.bindings) {
      return createDataMapFromGraphDB(result.results.bindings);
    }

    return new Map<string, string>();
  } catch {
    throw HTTPError(500, `Failed to get attributes for metric ${metric_label}`);
  }
}

// CQ8: What are the historical Values of [specific datapoint]?
async function getDataPointAtribute(metric: string)
: Promise<Map<string, string>>
{
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?p ?o WHERE {
          esg:${metric} ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);

    if (result.results && result.results.bindings) {
      return createDataMapFromGraphDB(result.results.bindings);
    }

    return new Map<string, string>();
  } catch {
    throw HTTPError(500, `Failed to get data point attributes for ${metric}`);
  }
}

// ========================================================================= //
// ========================== HELPER FUNCTIONS ============================= //
// ========================================================================= //

function removeIRI(line: string): string {
  return line.includes("#") ? line.split("#").slice(1).join("#") : line;
}

async function getDataSourceInfo(source: string) {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?p ?o WHERE {
          esg:${source} ?p ?o .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);

    if (result.results && result.results.bindings) {
      const resultMap = createDataMapFromGraphDB(result.results.bindings);
      return resultMap.get("label");
    }

    return undefined;
  } catch {
    throw HTTPError(404, `Failed to retrieve source of node ${source}`);
  }
}

// auto choose the best data source for a given metric, following IFRS disclosure hierarchy
async function getBestDataSourceForMetric(metricID: string): Promise<{ dataSourceID: string; disclosureType: string } | null> {
  const query = `
        ${ESG}
        ${RDFS}
        SELECT ?dataSourceID ?disclosureType WHERE {
            ?observation a esg:Observation ;
                        esg:metric ?metric ;
                        esg:obtainedFrom ?dataSourceID ;
                        esg:disclosureType ?disclosureType .
            
            ?metric rdfs:label "${metricID}" .
        }
        ORDER BY 
            # IFRS: regulatory_filing > company_report > third_party
            (IF(?disclosureType = esg:regulatory_filing, 1, 
                IF(?disclosureType = esg:company_report, 2, 
                    IF(?disclosureType = esg:third_party, 3, 4))))
    `;

  try {
    const results = await executeSparqlQuery(query);
    console.log(`Querying data sources for metric ${metricID}, found ${results.results.bindings.length} results`);

    if (results.results.bindings.length > 0) {
      const binding = results.results.bindings[0];
      const dataSourceID = binding.dataSourceID?.value || "";
      const disclosureType = binding.disclosureType?.value?.split("#")[1] || "unknown";

      console.log(`Selected data source for metric ${metricID}: ${dataSourceID} (disclosure type: ${disclosureType})`);

      return {
        dataSourceID,
        disclosureType
      };
    }

    console.log(`No data source found for metric ${metricID}`);
    return null;
  } catch (error) {
    console.error("Error querying best data source:", error);
    return null;
  }
}

/**
 * CQ6: Which Implementation is used to execute [specific model]?
 *
 * @param modelLabel - The label of the model
 * @returns Promise containing implementation information
 */
async function getImplementationByModel(modelLabel: string): Promise<{
  implementationLabel: string;
  language: string;
  filePath: string;
  functionName: string;
  description: string;
}> {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?implementationLabel ?language ?filePath ?functionName ?description WHERE {
      ?model a esg:Model ;
             rdfs:label "${modelLabel}" ;
             esg:executesWith ?implementation .
      
      ?implementation a esg:Implementation ;
                     rdfs:label ?implementationLabel ;
                     esg:hasLanguage ?language ;
                     esg:hasFilePath ?filePath ;
                     esg:hasFunction ?functionName ;
                     esg:hasDescription ?description .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);

    if (result.results && result.results.bindings && result.results.bindings.length > 0) {
      const binding = result.results.bindings[0];
      return {
        implementationLabel: binding.implementationLabel?.value || "",
        language: binding.language?.value || "",
        filePath: binding.filePath?.value || "",
        functionName: binding.functionName?.value || "",
        description: binding.description?.value || ""
      };
    }

    throw HTTPError(404, `No implementation found for model: ${modelLabel}`);
  } catch (error) {
    throw HTTPError(500, `Failed to get implementation for model ${modelLabel}: ${error}`);
  }
}

/**
 * Get detailed information about a specific Implementation
 *
 * @param implementationLabel - The label of the implementation
 * @returns Promise containing all implementation details
 */
async function getImplementationDetails(implementationLabel: string): Promise<{
  label: string;
  language: string;
  filePath: string;
  functionName: string;
  description: string;
  inputParameters: string;
  returnType: string;
  validation: string;
}> {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?label ?language ?filePath ?functionName ?description ?inputParameters ?returnType ?validation WHERE {
      ?implementation a esg:Implementation ;
                     rdfs:label "${implementationLabel}" ;
                     rdfs:label ?label ;
                     esg:hasLanguage ?language ;
                     esg:hasFilePath ?filePath ;
                     esg:hasFunction ?functionName ;
                     esg:hasDescription ?description ;
                     esg:hasInputParameters ?inputParameters ;
                     esg:hasReturnType ?returnType ;
                     esg:hasValidation ?validation .
    }
  `;

  try {
    const result = await executeSparqlQuery(query);

    if (result.results && result.results.bindings && result.results.bindings.length > 0) {
      const binding = result.results.bindings[0];
      return {
        label: binding.label?.value || "",
        language: binding.language?.value || "",
        filePath: binding.filePath?.value || "",
        functionName: binding.functionName?.value || "",
        description: binding.description?.value || "",
        inputParameters: binding.inputParameters?.value || "",
        returnType: binding.returnType?.value || "",
        validation: binding.validation?.value || ""
      };
    }

    throw HTTPError(404, `No implementation found with label: ${implementationLabel}`);
  } catch (error) {
    throw HTTPError(500, `Failed to get implementation details for ${implementationLabel}: ${error}`);
  }
}

/**
 * Get all available implementations in the knowledge graph
 *
 * @returns Promise containing array of implementation labels and basic info
 */
async function getAllImplementations(): Promise<{
  result: Array<{
    label: string;
    language: string;
    description: string;
  }>
}> {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?label ?language ?description WHERE {
      ?implementation a esg:Implementation ;
                     rdfs:label ?label ;
                     esg:hasLanguage ?language ;
                     esg:hasDescription ?description .
    }
    ORDER BY ?label
  `;

  try {
    const result = await executeSparqlQuery(query);
    const implementations: Array<{label: string; language: string; description: string}> = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.label && binding.language && binding.description) {
          implementations.push({
            label: binding.label.value,
            language: binding.language.value,
            description: binding.description.value
          });
        }
      }
    }

    return { result: implementations };
  } catch (error) {
    throw HTTPError(500, `Failed to get all implementations: ${error}`);
  }
}

/**
 * Get implementations filtered by calculation type
 *
 * @param calculationType - The calculation type to filter by (e.g., "percentage_ratio", "intensity_ratio")
 * @returns Promise containing array of implementations for the specified calculation type
 */
async function getImplementationsByCalculationType(calculationType: string): Promise<{
  result: Array<{
    implementationLabel: string;
    modelLabel: string;
    filePath: string;
    functionName: string;
    description: string;
  }>
}> {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?implementationLabel ?modelLabel ?filePath ?functionName ?description WHERE {
      ?model a esg:Model ;
             rdfs:label ?modelLabel ;
             esg:hasCalculationType "${calculationType}" ;
             esg:executesWith ?implementation .
      
      ?implementation a esg:Implementation ;
                     rdfs:label ?implementationLabel ;
                     esg:hasFilePath ?filePath ;
                     esg:hasFunction ?functionName ;
                     esg:hasDescription ?description .
    }
    ORDER BY ?implementationLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const implementations: Array<{
      implementationLabel: string;
      modelLabel: string;
      filePath: string;
      functionName: string;
      description: string;
    }> = [];

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.implementationLabel && binding.modelLabel && binding.filePath && binding.functionName && binding.description) {
          implementations.push({
            implementationLabel: binding.implementationLabel.value,
            modelLabel: binding.modelLabel.value,
            filePath: binding.filePath.value,
            functionName: binding.functionName.value,
            description: binding.description.value
          });
        }
      }
    }

    return { result: implementations };
  } catch (error) {
    throw HTTPError(500, `Failed to get implementations for calculation type ${calculationType}: ${error}`);
  }
}

/**
 * Get all available calculation types in the knowledge graph
 *
 * @returns Promise containing array of unique calculation types
 */
async function getAllCalculationTypes(): Promise<{
  result: Array<{
    calculationType: string;
    count: number;
    modelLabels: string[];
  }>
}> {
  const query = `
    ${ESG}
    ${RDFS}

    SELECT ?calculationType ?modelLabel WHERE {
      ?model a esg:Model ;
             rdfs:label ?modelLabel ;
             esg:hasCalculationType ?calculationType .
    }
    ORDER BY ?calculationType ?modelLabel
  `;

  try {
    const result = await executeSparqlQuery(query);
    const calculationTypeMap = new Map<string, Set<string>>();

    if (result.results && result.results.bindings) {
      for (const binding of result.results.bindings) {
        if (binding.calculationType && binding.modelLabel) {
          const calcType = binding.calculationType.value;
          const modelLabel = binding.modelLabel.value;

          if (!calculationTypeMap.has(calcType)) {
            calculationTypeMap.set(calcType, new Set());
          }
          calculationTypeMap.get(calcType)!.add(modelLabel);
        }
      }
    }

    const calculationTypes = Array.from(calculationTypeMap.entries()).map(([calcType, modelLabels]) => ({
      calculationType: calcType,
      count: modelLabels.size,
      modelLabels: Array.from(modelLabels)
    }));

    return { result: calculationTypes };
  } catch (error) {
    throw HTTPError(500, `Failed to get calculation types: ${error}`);
  }
}

export {
  getReportFramework,
  getCategoriesByIndustryAndReportFramework,
  getMetricsByIndustryAndCategory,
  getMetricAtributes, getDataPointAtribute,
  getDataSourceInfo,
  getBestDataSourceForMetric,
  executeSparqlQuery,
  getImplementationByModel,
  getImplementationDetails,
  getAllImplementations,
  getImplementationsByCalculationType,
  getAllCalculationTypes,
};
