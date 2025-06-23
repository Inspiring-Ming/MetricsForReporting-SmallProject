# 🛠️ MetricsForReporting: Guide

## 🎯 Objective

Build a **simple ESG metric reporting system** powered by a knowledge graph. This system should:

* Use **graph-based entities** (Metric, Model, DatasetVariable, etc.)
* Link sample data (e.g. from Eurofidai)
* Support basic **metric calculation and report generation**

---

## 📚 Project Breakdown

### 1. Understand the Data & Graph

#### ✅ Tasks:

* Load the **Eurofidai sample data** (CSV) and explore:

  * What metrics are reported?
  * What variables are present?
* Review the **graph schema** (see provided diagram with 7 core entities).
* Use sample RDF data to understand how graph entities are structured.

#### 💡 Output:

* One summary table: metric names, units, variables used
* One sample RDF graph in Turtle format

---

### 2. Build the Knowledge Graph

#### ✅ Tasks:

* Implement a graph with these 7 entities:

  * `Industry`, `ReportingFramework`, `Category`, `Metric`, `Model`, `Implementation`, `DatasetVariable`, `Datasource`
* For **each entity**, define key **attributes** (not just links).
  Example for `Metric`:

  ```
  Label: Carbon Emissions Intensity  
  Definition: CO2e emissions per unit of revenue  
  Unit: Ton_CO2e  
  Frequency: Annual  
  Mandatory: Yes  
  Source: IFRS S2  
  ```

#### 💡 Output:

* One Turtle (`.ttl`) file with at least one for each entity and two complete `Metric` examples(one for direct retrieve value from dataset, and one for calculated using other metrics)
* One visual diagram showing how entities connect (can reuse schema image)

---

### 3. Connect Graph to Sample Data

#### ✅ Tasks:

* Match **Eurofidai variables** to graph nodes (e.g., match "CO2e\_Total" to DatasetVariable)
* Link:

  * `Metric → isCalculatedBy → Model`
  * `Model → requiresInputFrom → DatasetVariable`
  * `DatasetVariable → from → Datasource`

#### 💡 Output:

* A mapping file (`metric_variable_mapping.csv`)
* Update RDF file with sample `Model` and `DatasetVariable` nodes

---

### 4. Design the System Architecture

#### ✅ Tasks:

* Create a simple architecture diagram (boxes + arrows):

  ```
  User → [Metric Selector] → [Graph Query] → [Model Calculator] → [PDF Report Generator]
  ```
* Clearly show which part:

  * Queries the graph
  * Loads sample data
  * Computes metric value
  * Generates output

#### 💡 Output:

* One PNG diagram (hand-drawn or digital)
* Description in `system_design.md`

---

### 5. Implement the Workflow

#### ✅ Tasks:

* Write a script (Python) that:

  1. Accepts a metric name (e.g., "Carbon Emissions Intensity")
  2. Looks up its model and required variables from the graph
  3. Loads the sample data
  4. Computes the metric using the model (e.g., a formula)
  5. Outputs result to screen or PDF

#### 💡 Output:

* Python script: `run_metric.py`
* At least one successful metric output (e.g., a JSON or PDF report)

---

### 6. Document Your Work

#### ✅ Tasks:

* Keep notes on:

  * What worked or didn’t
  * How you linked sample data to graph
  * Challenges in modeling, matching, or computing

#### 💡 Output:

* Final report (`project_summary.md`) answering:

  * What did your system do?
  * What graph entities were created?
  * What was calculated?
  * What challenges did you solve?

---

## 📦 Project Folder Structure

```
metrics-project/
├── data/
│   └── eurofidai_sample.csv
├── graph/
│   └── metric_graph.ttl
├── code/
│   └── run_metric.py
├── design/
│   └── architecture_diagram.png
├── docs/
│   ├── system_design.md
│   └── project_summary.md
└── README.md
```

---

## 🧠 Tips for Success

* Keep it **simple and working**, not big and broken.
* Focus on **one metric end-to-end**, then generalize.
* Use standard vocabularies like `rdfs:label`, `skos:definition`, `prov:wasDerivedFrom`.


