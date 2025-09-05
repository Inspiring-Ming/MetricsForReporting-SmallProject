import fs from "fs";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Bindings } from "@comunica/types";
import { Parser, Store } from "n3";
import HTTPError from "http-errors";
import { wrapError } from "../utils/generalHelper";

// Read Graph Data from file
const ttlData = fs.readFileSync("graph/esg_knowledge_graph_old.ttl", "utf-8");

// Parse them into Turtle
const parser = new Parser({ format: "text/turtle" });
const quads = parser.parse(ttlData);

// Load quads into RDFJS-compatible store
const store = new Store(quads);

// Create Comunica query engine
const engine = new QueryEngine();

// Global KG's Prefix
const ESG = "PREFIX esg: <http://example.org/esg#>";
const RDFS = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>";

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

  const bindingsStream = await engine.queryBindings(query, {
    sources: [store],
  });

  const res: string[] = [];

  for await (const binding of bindingsStream) {
    const frameworkLabel = binding.get("frameworkLabel")!.value;
    res.push(frameworkLabel);
  }

  return { result: res };
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

  const bindingsStream = await engine.queryBindings(query, {
    sources: [store],
  });

  const res: string[] = [];

  for await (const binding of bindingsStream) {
    const categoryLabel = binding.get("categoryLabel")!.value;
    res.push( categoryLabel );
  }

  return { result: res };
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

  const bindingsStream = await engine.queryBindings(query, {
    sources: [store],
  });

  const res: string[] = [];

  for await (const binding of bindingsStream) {
    const metricLabel = binding.get("metricLabel")!.value;
    res.push(metricLabel);
  }

  return { result: res };
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

  const bindingsStream = await engine.queryBindings(query, {
    sources: [store],
  });

  const res = await bindingsStream.toArray();
  const resultMap = createDataMap(res);

  return resultMap;
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
    const bindingsStream = await engine.queryBindings(query, {
      sources: [store],
    });

    const res = await bindingsStream.toArray();
    const resultMap = createDataMap(res);

    return resultMap;
  } catch (error) {
    wrapError(error);
  }
}

// ========================================================================= //
// ========================== HELPER FUNCTIONS ============================= //
// ========================================================================= //

function removeIRI(line: string): string {
  return line.includes("#") ? line.split("#").slice(1).join("#") : line;
}

function createDataMap(bindings: Bindings[])
: Map<string, string>
{
  const dataMap = new Map<string, string>;

  bindings.forEach(binding => {
    const p = binding.get("p")!.value;
    const o = binding.get("o")!.value;

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
  });

  return dataMap;
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
    const bindingsStream = await engine.queryBindings(query, {
      sources: [store],
    });

    const res = await bindingsStream.toArray();
    const resultMap = createDataMap(res);
    const dataSource = resultMap.get("label");

    return dataSource;
  } catch (e) {
    console.error(`❌ Failed to retreive source of node ${source} with error: \n`, e);
    throw HTTPError(404, `Failed to retreive source of node ${source}`);
  }
}

export {
  getReportFramework,
  getCategoriesByIndustryAndReportFramework,
  getMetricsByIndustryAndCategory,
  getMetricAtributes, getDataPointAtribute,
  getDataSourceInfo,
};
