/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MetricComputationController } from './../controllers/metricComputationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelController } from './../controllers/kg_controllers/modelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MetricController } from './../controllers/kg_controllers/metricController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IndustryController } from './../controllers/kg_controllers/industryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ImplementationController } from './../controllers/kg_controllers/implementationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FrameworkController } from './../controllers/kg_controllers/frameworkController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DatasourceController } from './../controllers/kg_controllers/datasourceController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DatasetVariableController } from './../controllers/kg_controllers/datasetVariableController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CategoryController } from './../controllers/kg_controllers/categoryController';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Pick_Model.iri-or-label-or-calculationType-or-formula-or-mathematicalExpression_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"calculationType":{"dataType":"string"},"formula":{"dataType":"string"},"mathematicalExpression":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Implementation.iri-or-label-or-language-or-filePath-or-functionName-or-returnType-or-validation_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"language":{"dataType":"string"},"filePath":{"dataType":"string"},"functionName":{"dataType":"string"},"returnType":{"dataType":"string"},"validation":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImplementationDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Implementation.iri-or-label-or-language-or-filePath-or-functionName-or-returnType-or-validation_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelDTO": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Pick_Model.iri-or-label-or-calculationType-or-formula-or-mathematicalExpression_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"implementation":{"dataType":"union","subSchemas":[{"ref":"ImplementationDTO"},{"dataType":"enum","enums":[null]}]}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelsResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"ModelDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelDetailDTO": {
        "dataType": "refObject",
        "properties": {
            "description": {"dataType":"string"},
            "inputMetrics": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}}},
            "implementation": {"dataType":"nestedObjectLiteral","nestedProperties":{"language":{"dataType":"string"},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"ref":"ModelDetailDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateModelResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "calculation_type": {"dataType":"string","required":true},
            "input_metrics": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "implementation": {"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}},"required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateModelRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "calculation_type": {"dataType":"string","required":true},
            "input_metrics": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "implementation": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "formula": {"dataType":"string"},
            "mathematical_expression": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateModelResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "inputMetrics": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}}},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateModelRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "calculation_type": {"dataType":"string"},
            "input_metrics": {"dataType":"array","array":{"dataType":"string"}},
            "implementation": {"dataType":"string"},
            "description": {"dataType":"string"},
            "formula": {"dataType":"string"},
            "mathematical_expression": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteModelResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelMetricsInputsResponse": {
        "dataType": "refObject",
        "properties": {
            "modelId": {"dataType":"string","required":true},
            "modelLabel": {"dataType":"string","required":true},
            "inputs": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"hasMetricType":{"dataType":"string"},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}]},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelMetricsOutputResponse": {
        "dataType": "refObject",
        "properties": {
            "modelId": {"dataType":"string","required":true},
            "modelLabel": {"dataType":"string","required":true},
            "output": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"hasMetricType":{"dataType":"string"},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"dataType":"enum","enums":["calculation_model"],"required":true},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateModelMetricsInputsResponse": {
        "dataType": "refObject",
        "properties": {
            "modelId": {"dataType":"string","required":true},
            "inputs": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateModelMetricsInputsRequest": {
        "dataType": "refObject",
        "properties": {
            "inputs": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddModelInputMetricResponse": {
        "dataType": "refObject",
        "properties": {
            "model_iri": {"dataType":"string","required":true},
            "metric_iri": {"dataType":"string","required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveModelInputMetricResponse": {
        "dataType": "refObject",
        "properties": {
            "model_iri": {"dataType":"string","required":true},
            "metric_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelImplementationsResponse": {
        "dataType": "refObject",
        "properties": {
            "modelId": {"dataType":"string","required":true},
            "modelLabel": {"dataType":"string","required":true},
            "implementations": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"functionName":{"dataType":"string"},"filePath":{"dataType":"string"},"language":{"dataType":"string"},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddModelImplementationResponse": {
        "dataType": "refObject",
        "properties": {
            "model_iri": {"dataType":"string","required":true},
            "implementation_iri": {"dataType":"string","required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddModelImplementationRequest": {
        "dataType": "refObject",
        "properties": {
            "implementationId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["SASBRequirement"]},{"dataType":"enum","enums":["Input Metric"]},{"dataType":"enum","enums":["Manual"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Quantitative"]},{"dataType":"enum","enums":["Discussion"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CalculationMethod": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Metric.iri-or-label-or-hasType-or-hasMetricType-or-hasUnit-or-hasCalculationMethod_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"hasType":{"ref":"MetricRole"},"hasMetricType":{"ref":"MetricType"},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"ref":"CalculationMethod","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Metric.iri-or-label-or-hasType-or-hasMetricType-or-hasUnit-or-hasCalculationMethod_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"MetricDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateMetricResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "code": {"dataType":"string"},
            "calculationMethod": {"ref":"CalculationMethod","required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateMetricRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "code": {"dataType":"string"},
            "description": {"dataType":"string"},
            "unit": {"dataType":"string"},
            "dataType": {"ref":"MetricType"},
            "calculationMethod": {"ref":"CalculationMethod","required":true},
            "hasType": {"ref":"MetricRole"},
            "industry": {"dataType":"string"},
            "category": {"dataType":"string"},
            "framework": {"dataType":"string"},
            "disclosureLevel": {"dataType":"double"},
            "additionalProperties": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Category.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_ReportingFramework.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Industry.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HierarchyDTO": {
        "dataType": "refObject",
        "properties": {
            "category": {"ref":"Pick_Category.iri-or-label_"},
            "framework": {"ref":"Pick_ReportingFramework.iri-or-label_"},
            "industry": {"ref":"Pick_Industry.iri-or-label_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"intersection","subSchemas":[{"ref":"MetricDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"string"},"createdAt":{"dataType":"string"},"hierarchy":{"ref":"HierarchyDTO"},"attributes":{"ref":"Record_string.any_"}}}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMetricResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "calculationMethod": {"ref":"CalculationMethod","required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMetricRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "code": {"dataType":"string"},
            "description": {"dataType":"string"},
            "unit": {"dataType":"string"},
            "dataType": {"ref":"MetricType"},
            "calculationMethod": {"ref":"CalculationMethod","required":true},
            "hasType": {"ref":"MetricRole"},
            "industry": {"dataType":"string"},
            "category": {"dataType":"string"},
            "framework": {"dataType":"string"},
            "disclosureLevel": {"dataType":"double"},
            "additionalProperties": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMetricModelResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_uri": {"dataType":"string","required":true},
            "metric_label": {"dataType":"string","required":true},
            "calculation_method": {"dataType":"string","required":true},
            "model": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"uri":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}]},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PatchMetricRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "code": {"dataType":"string"},
            "description": {"dataType":"string"},
            "unit": {"dataType":"string"},
            "dataType": {"ref":"MetricType"},
            "calculationMethod": {"ref":"CalculationMethod"},
            "hasType": {"ref":"MetricRole"},
            "model": {"dataType":"string"},
            "industry": {"dataType":"string"},
            "category": {"dataType":"string"},
            "framework": {"dataType":"string"},
            "disclosureLevel": {"dataType":"double"},
            "additionalProperties": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteMetricResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_DatasetVariable.iri-or-label-or-alignmentReason-or-confidenceScore-or-isUnitCompatible_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"alignmentReason":{"dataType":"string"},"confidenceScore":{"dataType":"double"},"isUnitCompatible":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_DataSource.iri-or-label-or-fileName-or-description-or-coverage-or-recordCount_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"fileName":{"dataType":"string"},"description":{"dataType":"string"},"coverage":{"dataType":"string"},"recordCount":{"dataType":"double"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DataSourceDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_DataSource.iri-or-label-or-fileName-or-description-or-coverage-or-recordCount_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetVariableDTO": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Pick_DatasetVariable.iri-or-label-or-alignmentReason-or-confidenceScore-or-isUnitCompatible_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"sources":{"dataType":"array","array":{"dataType":"refAlias","ref":"DataSourceDTO"}}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DirectMeasurementLineageResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "metric": {"dataType":"intersection","subSchemas":[{"ref":"MetricDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"hasCalculationMethod":{"dataType":"enum","enums":["direct_measurement"],"required":true}}}],"required":true},
            "lineageType": {"dataType":"enum","enums":["direct_measurement"],"required":true},
            "obtainedFrom": {"dataType":"array","array":{"dataType":"refAlias","ref":"DatasetVariableDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CalculationModelLineageResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "metric": {"dataType":"intersection","subSchemas":[{"ref":"MetricDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"hasCalculationMethod":{"dataType":"enum","enums":["calculation_model"],"required":true}}}],"required":true},
            "lineageType": {"dataType":"enum","enums":["calculation_model"],"required":true},
            "model": {"dataType":"union","subSchemas":[{"ref":"ModelDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "inputs": {"dataType":"array","array":{"dataType":"refAlias","ref":"DatasetVariableDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricLineageResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"DirectMeasurementLineageResponse"},{"ref":"CalculationModelLineageResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DirectMeasurementResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "metric": {"dataType":"intersection","subSchemas":[{"ref":"MetricDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"hasCalculationMethod":{"dataType":"enum","enums":["direct_measurement"],"required":true}}}],"required":true},
            "obtainedFrom": {"dataType":"array","array":{"dataType":"refAlias","ref":"DatasetVariableDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CalculationModelResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "metric": {"dataType":"intersection","subSchemas":[{"ref":"MetricDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"hasCalculationMethod":{"dataType":"enum","enums":["calculation_model"],"required":true}}}],"required":true},
            "model": {"dataType":"union","subSchemas":[{"ref":"ModelDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "inputs": {"dataType":"array","array":{"dataType":"refAlias","ref":"DatasetVariableDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricDatasetsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"DirectMeasurementResponse"},{"ref":"CalculationModelResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BestDataSourceResponse": {
        "dataType": "refObject",
        "properties": {
            "metricId": {"dataType":"string","required":true},
            "dataSource": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"description":{"dataType":"string"},"fileName":{"dataType":"string"},"disclosureType":{"dataType":"string","required":true},"dataSourceID":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricDataSourcesResponse": {
        "dataType": "refObject",
        "properties": {
            "metricId": {"dataType":"string","required":true},
            "metricLabel": {"dataType":"string","required":true},
            "calculationMethod": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},
            "dataSources": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"variables":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"isUnitCompatible":{"dataType":"string"},"confidenceScore":{"dataType":"double"},"alignmentReason":{"dataType":"string"},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}}},"coverage":{"dataType":"string"},"description":{"dataType":"string"},"recordCount":{"dataType":"double"},"disclosureType":{"dataType":"string","required":true},"fileName":{"dataType":"string"},"label":{"dataType":"string"},"dataSourceID":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricModelsResponse": {
        "dataType": "refObject",
        "properties": {
            "metricId": {"dataType":"string","required":true},
            "metricLabel": {"dataType":"string","required":true},
            "models": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"implementation":{"dataType":"nestedObjectLiteral","nestedProperties":{"language":{"dataType":"string"},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"outputMetric":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"mathematicalExpression":{"dataType":"string"},"formula":{"dataType":"string"},"calculationType":{"dataType":"string"},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricInputsResponse": {
        "dataType": "refObject",
        "properties": {
            "metricId": {"dataType":"string","required":true},
            "metricLabel": {"dataType":"string","required":true},
            "calculationMethod": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},
            "model": {"dataType":"nestedObjectLiteral","nestedProperties":{"calculationType":{"dataType":"string"},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},
            "inputs": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"hasInputs":{"dataType":"boolean"},"hasType":{"dataType":"string"},"hasMetricType":{"dataType":"string"},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}]},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_iri": {"dataType":"string","required":true},
            "datasource_iri": {"dataType":"string","required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricDatasourceRequest": {
        "dataType": "refObject",
        "properties": {
            "datasourceUri": {"dataType":"string","required":true},
            "datasetVariableUri": {"dataType":"string"},
            "disclosureLevel": {"dataType":"double"},
            "priority": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveMetricDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_iri": {"dataType":"string","required":true},
            "datasource_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricInputResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_iri": {"dataType":"string","required":true},
            "input_metric_iri": {"dataType":"string","required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricInputRequest": {
        "dataType": "refObject",
        "properties": {
            "inputMetricUri": {"dataType":"string","required":true},
            "order": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveMetricInputResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_iri": {"dataType":"string","required":true},
            "input_metric_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BatchCreateMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "created": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "failed": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true},"label":{"dataType":"string","required":true}}},"required":true},
            "total_created": {"dataType":"double","required":true},
            "total_failed": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BatchCreateMetricsRequest": {
        "dataType": "refObject",
        "properties": {
            "metrics": {"dataType":"array","array":{"dataType":"refObject","ref":"CreateMetricRequest"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BatchDeleteMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "deleted": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "failed": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total_deleted": {"dataType":"double","required":true},
            "total_failed": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BatchDeleteMetricsRequest": {
        "dataType": "refObject",
        "properties": {
            "metricIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "cascade": {"dataType":"boolean"},
            "force": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricCalculationMethodResponse": {
        "dataType": "refObject",
        "properties": {
            "metric_label": {"dataType":"string","required":true},
            "metric_iri": {"dataType":"string","required":true},
            "calculation_method": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},
            "attributes": {"ref":"Record_string.any_"},
            "data_sources": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"description":{"dataType":"string"},"fileName":{"dataType":"string"},"disclosureType":{"dataType":"string","required":true},"dataSourceID":{"dataType":"string","required":true}}}},
            "model": {"dataType":"nestedObjectLiteral","nestedProperties":{"description":{"dataType":"string"},"mathematicalExpression":{"dataType":"string"},"formula":{"dataType":"string"},"calculationType":{"dataType":"string"},"iri":{"dataType":"string","required":true},"label":{"dataType":"string","required":true}}},
            "implementation": {"dataType":"nestedObjectLiteral","nestedProperties":{"description":{"dataType":"string"},"functionName":{"dataType":"string"},"filePath":{"dataType":"string"},"language":{"dataType":"string"},"iri":{"dataType":"string","required":true},"label":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricModelsDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "metricId": {"dataType":"string","required":true},
            "metricLabel": {"dataType":"string","required":true},
            "calculationMethod": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},
            "usage": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["output"]},{"dataType":"enum","enums":["input"]}],"required":true},
            "models": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"outputMetric":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"inputMetrics":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}}},"implementation":{"dataType":"nestedObjectLiteral","nestedProperties":{"language":{"dataType":"string"},"label":{"dataType":"string"},"iri":{"dataType":"string","required":true}}},"mathematicalExpression":{"dataType":"string"},"formula":{"dataType":"string"},"calculationType":{"dataType":"string"},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Industry.iri-or-label-or-description_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"description":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Industry.iri-or-label-or-description_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustriesResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"IndustryDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDetailDTO": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string"},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_ReportingFramework.iri-or-label_"}},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IndustryDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"ref":"IndustryDetailDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateIndustryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateIndustryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "description": {"dataType":"string"},
            "reportsUsing": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteIndustryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImplementationsResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"ImplementationDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImplementationDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"intersection","subSchemas":[{"ref":"ImplementationDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"string"},"createdAt":{"dataType":"string"},"relatedModels":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"calculationType":{"dataType":"string"},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}}},"inputParameters":{"dataType":"string"},"description":{"dataType":"string"}}}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateImplementationResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "language": {"dataType":"string","required":true},
            "file_path": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateImplementationRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "language": {"dataType":"string","required":true},
            "file_path": {"dataType":"string","required":true},
            "function_name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "input_parameters": {"dataType":"string"},
            "return_type": {"dataType":"string"},
            "validation": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateImplementationResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "language": {"dataType":"string"},
            "file_path": {"dataType":"string"},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateImplementationRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "language": {"dataType":"string"},
            "file_path": {"dataType":"string"},
            "function_name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "input_parameters": {"dataType":"string"},
            "return_type": {"dataType":"string"},
            "validation": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteImplementationResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FrameworkDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_ReportingFramework.iri-or-label_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FrameworksResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"FrameworkDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FrameworkDetailDTO": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string"},
            "categories": {"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_Category.iri-or-label_"}},
            "sourceDocument": {"dataType":"string"},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FrameworkDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"ref":"FrameworkDetailDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateFrameworkResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "sourceDocument": {"dataType":"string"},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateFrameworkRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "sourceDocument": {"dataType":"string"},
            "categories": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateFrameworkResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "sourceDocument": {"dataType":"string"},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateFrameworkRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "sourceDocument": {"dataType":"string"},
            "categories": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteFrameworkResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryDTO": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Category.iri-or-label_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FrameworkCategoriesResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"CategoryDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddCategoriesToFrameworkResponse": {
        "dataType": "refObject",
        "properties": {
            "framework_iri": {"dataType":"string","required":true},
            "added_categories": {"dataType":"array","array":{"dataType":"refAlias","ref":"CategoryDTO"},"required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddCategoriesToFrameworkRequest": {
        "dataType": "refObject",
        "properties": {
            "categories": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveCategoryFromFrameworkResponse": {
        "dataType": "refObject",
        "properties": {
            "framework_iri": {"dataType":"string","required":true},
            "removed_category_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasourcesResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"DataSourceDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_DatasetVariable.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasourceDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"intersection","subSchemas":[{"ref":"DataSourceDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"string"},"createdAt":{"dataType":"string"},"variables":{"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_DatasetVariable.iri-or-label_"}}}}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDatasourceRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "fileName": {"dataType":"string"},
            "description": {"dataType":"string"},
            "coverage": {"dataType":"string"},
            "recordCount": {"dataType":"double"},
            "disclosureType": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDatasourceRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "fileName": {"dataType":"string"},
            "description": {"dataType":"string"},
            "coverage": {"dataType":"string"},
            "recordCount": {"dataType":"double"},
            "disclosureType": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasourceVariablesResponse": {
        "dataType": "refObject",
        "properties": {
            "datasource_id": {"dataType":"string","required":true},
            "datasource_label": {"dataType":"string","required":true},
            "variables": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"alignmentReason":{"dataType":"string"},"confidenceScore":{"dataType":"double"},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasourceMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "datasource_id": {"dataType":"string","required":true},
            "datasource_label": {"dataType":"string","required":true},
            "metrics": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"variable":{"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}},"required":true},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetVariablesResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"DatasetVariableDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Metric.iri-or-label-or-hasCalculationMethod_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"},"hasCalculationMethod":{"ref":"CalculationMethod","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetVariableDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"intersection","subSchemas":[{"ref":"DatasetVariableDTO"},{"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"string"},"createdAt":{"dataType":"string"},"metrics":{"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_Metric.iri-or-label-or-hasCalculationMethod_"}}}}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDatasetVariableResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDatasetVariableRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "alignmentReason": {"dataType":"string"},
            "confidenceScore": {"dataType":"double"},
            "isUnitCompatible": {"dataType":"string"},
            "sources": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDatasetVariableResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDatasetVariableRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "alignmentReason": {"dataType":"string"},
            "confidenceScore": {"dataType":"double"},
            "isUnitCompatible": {"dataType":"string"},
            "sources": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteDatasetVariableResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VariableDatasourcesResponse": {
        "dataType": "refObject",
        "properties": {
            "variable_id": {"dataType":"string","required":true},
            "variable_label": {"dataType":"string","required":true},
            "datasources": {"dataType":"array","array":{"dataType":"refAlias","ref":"DataSourceDTO"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddDatasourceToVariableResponse": {
        "dataType": "refObject",
        "properties": {
            "variable_iri": {"dataType":"string","required":true},
            "datasource_iri": {"dataType":"string","required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddDatasourceToVariableRequest": {
        "dataType": "refObject",
        "properties": {
            "datasourceUri": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveVariableDatasourceResponse": {
        "dataType": "refObject",
        "properties": {
            "variable_iri": {"dataType":"string","required":true},
            "datasource_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetVariableQualityResponse": {
        "dataType": "refObject",
        "properties": {
            "variable_id": {"dataType":"string","required":true},
            "variable_label": {"dataType":"string","required":true},
            "confidenceScore": {"dataType":"double"},
            "isUnitCompatible": {"dataType":"string"},
            "alignmentReason": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VariableMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "variable_id": {"dataType":"string","required":true},
            "variable_label": {"dataType":"string","required":true},
            "metrics": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"hasMetricType":{"dataType":"string"},"hasUnit":{"dataType":"string"},"hasCalculationMethod":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}],"required":true},"label":{"dataType":"string","required":true},"iri":{"dataType":"string","required":true}}},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoriesResponse": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double"},
            "size": {"dataType":"double"},
            "total": {"dataType":"double"},
            "totalPages": {"dataType":"double"},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"CategoryDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Metric.iri-or-label_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"iri":{"dataType":"string","required":true},"label":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryDetailDTO": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string"},
            "metrics": {"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_Metric.iri-or-label_"}},
            "frameworks": {"dataType":"array","array":{"dataType":"refAlias","ref":"Pick_ReportingFramework.iri-or-label_"}},
            "createdAt": {"dataType":"string"},
            "updatedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"ref":"CategoryDetailDTO","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCategoryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCategoryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "metrics": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCategoryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCategoryRequest": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "metrics": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteCategoryResponse": {
        "dataType": "refObject",
        "properties": {
            "iri": {"dataType":"string","required":true},
            "deleted": {"dataType":"boolean","required":true},
            "deleted_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CategoryMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"MetricDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricsToCategoryResponse": {
        "dataType": "refObject",
        "properties": {
            "category_iri": {"dataType":"string","required":true},
            "added_metrics": {"dataType":"array","array":{"dataType":"refAlias","ref":"MetricDTO"},"required":true},
            "added_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddMetricsToCategoryRequest": {
        "dataType": "refObject",
        "properties": {
            "metrics": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveMetricFromCategoryResponse": {
        "dataType": "refObject",
        "properties": {
            "category_iri": {"dataType":"string","required":true},
            "removed_metric_iri": {"dataType":"string","required":true},
            "removed_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsMetricComputationController_getComputationMethodWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                metric_label: {"in":"query","name":"metric_label","required":true,"dataType":"string"},
        };
        app.get('/api/computation/method',
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController)),
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController.prototype.getComputationMethodWithTsoa)),

            async function MetricComputationController_getComputationMethodWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricComputationController_getComputationMethodWithTsoa, request, response });

                const controller = new MetricComputationController();

              await templateService.apiHandler({
                methodName: 'getComputationMethodWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricComputationController_getImplementationInfoWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                implementation_label: {"in":"query","name":"implementation_label","required":true,"dataType":"string"},
        };
        app.get('/api/computation/implementation',
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController)),
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController.prototype.getImplementationInfoWithTsoa)),

            async function MetricComputationController_getImplementationInfoWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricComputationController_getImplementationInfoWithTsoa, request, response });

                const controller = new MetricComputationController();

              await templateService.apiHandler({
                methodName: 'getImplementationInfoWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricComputationController_getImplementationsByTypeWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                calculation_type: {"in":"query","name":"calculation_type","required":true,"dataType":"string"},
        };
        app.get('/api/computation/implementations',
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController)),
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController.prototype.getImplementationsByTypeWithTsoa)),

            async function MetricComputationController_getImplementationsByTypeWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricComputationController_getImplementationsByTypeWithTsoa, request, response });

                const controller = new MetricComputationController();

              await templateService.apiHandler({
                methodName: 'getImplementationsByTypeWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricComputationController_getSupportedCalculationTypesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/computation/supported-types',
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController)),
            ...(fetchMiddlewares<RequestHandler>(MetricComputationController.prototype.getSupportedCalculationTypesWithTsoa)),

            async function MetricComputationController_getSupportedCalculationTypesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricComputationController_getSupportedCalculationTypesWithTsoa, request, response });

                const controller = new MetricComputationController();

              await templateService.apiHandler({
                methodName: 'getSupportedCalculationTypesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_getModelsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                calculationType: {"in":"query","name":"calculationType","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/models',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModelsWithTsoa)),

            async function ModelController_getModelsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModelsWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModelsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_getModelByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/models/:id',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModelByIdWithTsoa)),

            async function ModelController_getModelByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModelByIdWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModelByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_createModelWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateModelRequest"},
        };
        app.post('/api/kg/models',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.createModelWithTsoa)),

            async function ModelController_createModelWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_createModelWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'createModelWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_updateModelWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateModelRequest"},
        };
        app.put('/api/kg/models/:id',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.updateModelWithTsoa)),

            async function ModelController_updateModelWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_updateModelWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'updateModelWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_deleteModelWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/models/:id',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.deleteModelWithTsoa)),

            async function ModelController_deleteModelWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_deleteModelWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'deleteModelWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_getModelInputMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/models/:id/metrics/inputs',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModelInputMetricsWithTsoa)),

            async function ModelController_getModelInputMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModelInputMetricsWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModelInputMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_getModelOutputMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/models/:id/metrics/output',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModelOutputMetricWithTsoa)),

            async function ModelController_getModelOutputMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModelOutputMetricWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModelOutputMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_updateModelInputMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateModelMetricsInputsRequest"},
        };
        app.put('/api/kg/models/:id/metrics/inputs',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.updateModelInputMetricsWithTsoa)),

            async function ModelController_updateModelInputMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_updateModelInputMetricsWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'updateModelInputMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_addModelInputMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                metricId: {"in":"path","name":"metricId","required":true,"dataType":"string"},
        };
        app.post('/api/kg/models/:id/metrics/inputs/:metricId',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.addModelInputMetricWithTsoa)),

            async function ModelController_addModelInputMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_addModelInputMetricWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'addModelInputMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_removeModelInputMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                metricId: {"in":"path","name":"metricId","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/models/:id/metrics/inputs/:metricId',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.removeModelInputMetricWithTsoa)),

            async function ModelController_removeModelInputMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_removeModelInputMetricWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'removeModelInputMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_getModelImplementationsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/models/:id/implementations',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModelImplementationsWithTsoa)),

            async function ModelController_getModelImplementationsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModelImplementationsWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModelImplementationsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsModelController_addModelImplementationWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AddModelImplementationRequest"},
        };
        app.post('/api/kg/models/:id/implementations',
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.addModelImplementationWithTsoa)),

            async function ModelController_addModelImplementationWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_addModelImplementationWithTsoa, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'addModelImplementationWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                industry: {"in":"query","name":"industry","dataType":"string"},
                category: {"in":"query","name":"category","dataType":"string"},
                framework: {"in":"query","name":"framework","dataType":"string"},
                calculationMethod: {"in":"query","name":"calculationMethod","dataType":"union","subSchemas":[{"dataType":"enum","enums":["direct_measurement"]},{"dataType":"enum","enums":["calculation_model"]}]},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/metrics',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricsWithTsoa)),

            async function MetricController_getMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_createMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"ref":"CreateMetricRequest"},
        };
        app.post('/api/kg/metrics',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.createMetricWithTsoa)),

            async function MetricController_createMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_createMetricWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'createMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricByIdWithTsoa)),

            async function MetricController_getMetricByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricByIdWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_updateMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"UpdateMetricRequest"},
        };
        app.put('/api/kg/metrics/:id',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.updateMetricWithTsoa)),

            async function MetricController_updateMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_updateMetricWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'updateMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_patchMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"PatchMetricRequest"},
        };
        app.patch('/api/kg/metrics/:id',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.patchMetricWithTsoa)),

            async function MetricController_patchMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_patchMetricWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'patchMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_deleteMetricWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                cascade: {"in":"query","name":"cascade","dataType":"boolean"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/metrics/:id',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.deleteMetricWithTsoa)),

            async function MetricController_deleteMetricWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_deleteMetricWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'deleteMetricWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricLineageWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/lineage',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricLineageWithTsoa)),

            async function MetricController_getMetricLineageWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricLineageWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricLineageWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricDatasetsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/datasets',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricDatasetsWithTsoa)),

            async function MetricController_getMetricDatasetsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricDatasetsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricDatasetsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getBestDataSourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/best-datasource',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getBestDataSourceWithTsoa)),

            async function MetricController_getBestDataSourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getBestDataSourceWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getBestDataSourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricDataSourcesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                includeVariables: {"in":"query","name":"includeVariables","dataType":"boolean"},
        };
        app.get('/api/kg/metrics/:id/datasources',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricDataSourcesWithTsoa)),

            async function MetricController_getMetricDataSourcesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricDataSourcesWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricDataSourcesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricModelsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/models',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricModelsWithTsoa)),

            async function MetricController_getMetricModelsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricModelsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricModelsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricInputsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/inputs',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricInputsWithTsoa)),

            async function MetricController_getMetricInputsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricInputsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricInputsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_addMetricDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"AddMetricDatasourceRequest"},
        };
        app.post('/api/kg/metrics/:id/datasources',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.addMetricDatasourceWithTsoa)),

            async function MetricController_addMetricDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_addMetricDatasourceWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'addMetricDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_removeMetricDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                datasourceId: {"in":"path","name":"datasourceId","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/metrics/:id/datasources/:datasourceId',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.removeMetricDatasourceWithTsoa)),

            async function MetricController_removeMetricDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_removeMetricDatasourceWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'removeMetricDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_addMetricInputWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"AddMetricInputRequest"},
        };
        app.post('/api/kg/metrics/:id/inputs',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.addMetricInputWithTsoa)),

            async function MetricController_addMetricInputWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_addMetricInputWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'addMetricInputWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_removeMetricInputWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                inputMetricId: {"in":"path","name":"inputMetricId","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/metrics/:id/inputs/:inputMetricId',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.removeMetricInputWithTsoa)),

            async function MetricController_removeMetricInputWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_removeMetricInputWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'removeMetricInputWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_batchCreateMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"ref":"BatchCreateMetricsRequest"},
        };
        app.post('/api/kg/metrics/batch',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.batchCreateMetricsWithTsoa)),

            async function MetricController_batchCreateMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_batchCreateMetricsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'batchCreateMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_batchDeleteMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"ref":"BatchDeleteMetricsRequest"},
        };
        app.delete('/api/kg/metrics/batch',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.batchDeleteMetricsWithTsoa)),

            async function MetricController_batchDeleteMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_batchDeleteMetricsWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'batchDeleteMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricCalculationMethodWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/:id/calculation-method',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricCalculationMethodWithTsoa)),

            async function MetricController_getMetricCalculationMethodWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricCalculationMethodWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricCalculationMethodWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricAttributesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                metric_label: {"in":"query","name":"metric_label","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/attributes',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricAttributesWithTsoa)),

            async function MetricController_getMetricAttributesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricAttributesWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricAttributesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getDataPointAttributesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                metric: {"in":"query","name":"metric","required":true,"dataType":"string"},
        };
        app.get('/api/kg/metrics/datapoints/attributes',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getDataPointAttributesWithTsoa)),

            async function MetricController_getDataPointAttributesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getDataPointAttributesWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getDataPointAttributesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMetricController_getMetricModelsDetailWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                usage: {"in":"query","name":"usage","dataType":"union","subSchemas":[{"dataType":"enum","enums":["output"]},{"dataType":"enum","enums":["input"]}]},
        };
        app.get('/api/kg/metrics/:id/models',
            ...(fetchMiddlewares<RequestHandler>(MetricController)),
            ...(fetchMiddlewares<RequestHandler>(MetricController.prototype.getMetricModelsDetailWithTsoa)),

            async function MetricController_getMetricModelsDetailWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMetricController_getMetricModelsDetailWithTsoa, request, response });

                const controller = new MetricController();

              await templateService.apiHandler({
                methodName: 'getMetricModelsDetailWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_getIndustriesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/industries',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.getIndustriesWithTsoa)),

            async function IndustryController_getIndustriesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_getIndustriesWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'getIndustriesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_getIndustryByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.getIndustryByIdWithTsoa)),

            async function IndustryController_getIndustryByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_getIndustryByIdWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'getIndustryByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_createIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateIndustryRequest"},
        };
        app.post('/api/kg/industries',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.createIndustryWithTsoa)),

            async function IndustryController_createIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_createIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'createIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_updateIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateIndustryRequest"},
        };
        app.patch('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.updateIndustryWithTsoa)),

            async function IndustryController_updateIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_updateIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'updateIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIndustryController_deleteIndustryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/industries/:id',
            ...(fetchMiddlewares<RequestHandler>(IndustryController)),
            ...(fetchMiddlewares<RequestHandler>(IndustryController.prototype.deleteIndustryWithTsoa)),

            async function IndustryController_deleteIndustryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIndustryController_deleteIndustryWithTsoa, request, response });

                const controller = new IndustryController();

              await templateService.apiHandler({
                methodName: 'deleteIndustryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImplementationController_getImplementationsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                language: {"in":"query","name":"language","dataType":"string"},
                filePath: {"in":"query","name":"filePath","dataType":"string"},
                calculationType: {"in":"query","name":"calculationType","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/implementations',
            ...(fetchMiddlewares<RequestHandler>(ImplementationController)),
            ...(fetchMiddlewares<RequestHandler>(ImplementationController.prototype.getImplementationsWithTsoa)),

            async function ImplementationController_getImplementationsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImplementationController_getImplementationsWithTsoa, request, response });

                const controller = new ImplementationController();

              await templateService.apiHandler({
                methodName: 'getImplementationsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImplementationController_getImplementationByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/implementations/:id',
            ...(fetchMiddlewares<RequestHandler>(ImplementationController)),
            ...(fetchMiddlewares<RequestHandler>(ImplementationController.prototype.getImplementationByIdWithTsoa)),

            async function ImplementationController_getImplementationByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImplementationController_getImplementationByIdWithTsoa, request, response });

                const controller = new ImplementationController();

              await templateService.apiHandler({
                methodName: 'getImplementationByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImplementationController_createImplementationWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateImplementationRequest"},
        };
        app.post('/api/kg/implementations',
            ...(fetchMiddlewares<RequestHandler>(ImplementationController)),
            ...(fetchMiddlewares<RequestHandler>(ImplementationController.prototype.createImplementationWithTsoa)),

            async function ImplementationController_createImplementationWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImplementationController_createImplementationWithTsoa, request, response });

                const controller = new ImplementationController();

              await templateService.apiHandler({
                methodName: 'createImplementationWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImplementationController_updateImplementationWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateImplementationRequest"},
        };
        app.patch('/api/kg/implementations/:id',
            ...(fetchMiddlewares<RequestHandler>(ImplementationController)),
            ...(fetchMiddlewares<RequestHandler>(ImplementationController.prototype.updateImplementationWithTsoa)),

            async function ImplementationController_updateImplementationWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImplementationController_updateImplementationWithTsoa, request, response });

                const controller = new ImplementationController();

              await templateService.apiHandler({
                methodName: 'updateImplementationWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImplementationController_deleteImplementationWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/implementations/:id',
            ...(fetchMiddlewares<RequestHandler>(ImplementationController)),
            ...(fetchMiddlewares<RequestHandler>(ImplementationController.prototype.deleteImplementationWithTsoa)),

            async function ImplementationController_deleteImplementationWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImplementationController_deleteImplementationWithTsoa, request, response });

                const controller = new ImplementationController();

              await templateService.apiHandler({
                methodName: 'deleteImplementationWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_getFrameworksWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                industry: {"in":"query","name":"industry","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/frameworks',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.getFrameworksWithTsoa)),

            async function FrameworkController_getFrameworksWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_getFrameworksWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'getFrameworksWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_getFrameworkByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/frameworks/:id',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.getFrameworkByIdWithTsoa)),

            async function FrameworkController_getFrameworkByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_getFrameworkByIdWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'getFrameworkByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_createFrameworkWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateFrameworkRequest"},
        };
        app.post('/api/kg/frameworks',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.createFrameworkWithTsoa)),

            async function FrameworkController_createFrameworkWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_createFrameworkWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'createFrameworkWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_updateFrameworkWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateFrameworkRequest"},
        };
        app.patch('/api/kg/frameworks/:id',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.updateFrameworkWithTsoa)),

            async function FrameworkController_updateFrameworkWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_updateFrameworkWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'updateFrameworkWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_deleteFrameworkWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/frameworks/:id',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.deleteFrameworkWithTsoa)),

            async function FrameworkController_deleteFrameworkWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_deleteFrameworkWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'deleteFrameworkWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_getFrameworkCategoriesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/frameworks/:id/categories',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.getFrameworkCategoriesWithTsoa)),

            async function FrameworkController_getFrameworkCategoriesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_getFrameworkCategoriesWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'getFrameworkCategoriesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_addCategoriesToFrameworkWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AddCategoriesToFrameworkRequest"},
        };
        app.post('/api/kg/frameworks/:id/categories',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.addCategoriesToFrameworkWithTsoa)),

            async function FrameworkController_addCategoriesToFrameworkWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_addCategoriesToFrameworkWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'addCategoriesToFrameworkWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFrameworkController_removeCategoryFromFrameworkWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                cid: {"in":"path","name":"cid","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/frameworks/:id/categories/:cid',
            ...(fetchMiddlewares<RequestHandler>(FrameworkController)),
            ...(fetchMiddlewares<RequestHandler>(FrameworkController.prototype.removeCategoryFromFrameworkWithTsoa)),

            async function FrameworkController_removeCategoryFromFrameworkWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFrameworkController_removeCategoryFromFrameworkWithTsoa, request, response });

                const controller = new FrameworkController();

              await templateService.apiHandler({
                methodName: 'removeCategoryFromFrameworkWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_getDatasourcesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["fileName"]},{"dataType":"enum","enums":["recordCount"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/datasources',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.getDatasourcesWithTsoa)),

            async function DatasourceController_getDatasourcesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_getDatasourcesWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'getDatasourcesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_getDatasourceByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/datasources/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.getDatasourceByIdWithTsoa)),

            async function DatasourceController_getDatasourceByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_getDatasourceByIdWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'getDatasourceByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_createDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"ref":"CreateDatasourceRequest"},
        };
        app.post('/api/kg/datasources',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.createDatasourceWithTsoa)),

            async function DatasourceController_createDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_createDatasourceWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'createDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_updateDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"UpdateDatasourceRequest"},
        };
        app.patch('/api/kg/datasources/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.updateDatasourceWithTsoa)),

            async function DatasourceController_updateDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_updateDatasourceWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'updateDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_deleteDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/datasources/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.deleteDatasourceWithTsoa)),

            async function DatasourceController_deleteDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_deleteDatasourceWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'deleteDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_getDatasourceVariablesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/datasources/:id/variables',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.getDatasourceVariablesWithTsoa)),

            async function DatasourceController_getDatasourceVariablesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_getDatasourceVariablesWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'getDatasourceVariablesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasourceController_getDatasourceMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/datasources/:id/metrics',
            ...(fetchMiddlewares<RequestHandler>(DatasourceController)),
            ...(fetchMiddlewares<RequestHandler>(DatasourceController.prototype.getDatasourceMetricsWithTsoa)),

            async function DatasourceController_getDatasourceMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasourceController_getDatasourceMetricsWithTsoa, request, response });

                const controller = new DatasourceController();

              await templateService.apiHandler({
                methodName: 'getDatasourceMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_getDatasetVariablesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                datasource: {"in":"query","name":"datasource","dataType":"string"},
                metric: {"in":"query","name":"metric","dataType":"string"},
                minConfidenceScore: {"in":"query","name":"minConfidenceScore","dataType":"double"},
                isUnitCompatible: {"in":"query","name":"isUnitCompatible","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["confidenceScore"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/dataset-variables',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.getDatasetVariablesWithTsoa)),

            async function DatasetVariableController_getDatasetVariablesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_getDatasetVariablesWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'getDatasetVariablesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_getDatasetVariableByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/dataset-variables/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.getDatasetVariableByIdWithTsoa)),

            async function DatasetVariableController_getDatasetVariableByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_getDatasetVariableByIdWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'getDatasetVariableByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_createDatasetVariableWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateDatasetVariableRequest"},
        };
        app.post('/api/kg/dataset-variables',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.createDatasetVariableWithTsoa)),

            async function DatasetVariableController_createDatasetVariableWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_createDatasetVariableWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'createDatasetVariableWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_updateDatasetVariableWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateDatasetVariableRequest"},
        };
        app.patch('/api/kg/dataset-variables/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.updateDatasetVariableWithTsoa)),

            async function DatasetVariableController_updateDatasetVariableWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_updateDatasetVariableWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'updateDatasetVariableWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_deleteDatasetVariableWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/dataset-variables/:id',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.deleteDatasetVariableWithTsoa)),

            async function DatasetVariableController_deleteDatasetVariableWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_deleteDatasetVariableWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'deleteDatasetVariableWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_getVariableDatasourcesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/dataset-variables/:id/datasources',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.getVariableDatasourcesWithTsoa)),

            async function DatasetVariableController_getVariableDatasourcesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_getVariableDatasourcesWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'getVariableDatasourcesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_addDatasourceToVariableWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AddDatasourceToVariableRequest"},
        };
        app.post('/api/kg/dataset-variables/:id/datasources',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.addDatasourceToVariableWithTsoa)),

            async function DatasetVariableController_addDatasourceToVariableWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_addDatasourceToVariableWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'addDatasourceToVariableWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_removeVariableDatasourceWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                dsId: {"in":"path","name":"dsId","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/dataset-variables/:id/datasources/:dsId',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.removeVariableDatasourceWithTsoa)),

            async function DatasetVariableController_removeVariableDatasourceWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_removeVariableDatasourceWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'removeVariableDatasourceWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_getVariableQualityWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/dataset-variables/:id/quality',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.getVariableQualityWithTsoa)),

            async function DatasetVariableController_getVariableQualityWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_getVariableQualityWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'getVariableQualityWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDatasetVariableController_getVariableMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/dataset-variables/:id/metrics',
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetVariableController.prototype.getVariableMetricsWithTsoa)),

            async function DatasetVariableController_getVariableMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDatasetVariableController_getVariableMetricsWithTsoa, request, response });

                const controller = new DatasetVariableController();

              await templateService.apiHandler({
                methodName: 'getVariableMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_getCategoriesWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                size: {"in":"query","name":"size","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                industry: {"in":"query","name":"industry","dataType":"string"},
                framework: {"in":"query","name":"framework","dataType":"string"},
                sort: {"in":"query","name":"sort","dataType":"union","subSchemas":[{"dataType":"enum","enums":["label"]},{"dataType":"enum","enums":["createdAt"]}]},
                order: {"in":"query","name":"order","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/kg/categories',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.getCategoriesWithTsoa)),

            async function CategoryController_getCategoriesWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getCategoriesWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'getCategoriesWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_getCategoryByIdWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.getCategoryByIdWithTsoa)),

            async function CategoryController_getCategoryByIdWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getCategoryByIdWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'getCategoryByIdWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_createCategoryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"ref":"CreateCategoryRequest"},
        };
        app.post('/api/kg/categories',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.createCategoryWithTsoa)),

            async function CategoryController_createCategoryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_createCategoryWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'createCategoryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_updateCategoryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"UpdateCategoryRequest"},
        };
        app.patch('/api/kg/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.updateCategoryWithTsoa)),

            async function CategoryController_updateCategoryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_updateCategoryWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'updateCategoryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_deleteCategoryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                force: {"in":"query","name":"force","dataType":"boolean"},
        };
        app.delete('/api/kg/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.deleteCategoryWithTsoa)),

            async function CategoryController_deleteCategoryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_deleteCategoryWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'deleteCategoryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_getCategoryMetricsWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/kg/categories/:id/metrics',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.getCategoryMetricsWithTsoa)),

            async function CategoryController_getCategoryMetricsWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getCategoryMetricsWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'getCategoryMetricsWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_addMetricsToCategoryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                data: {"in":"body","name":"data","required":true,"ref":"AddMetricsToCategoryRequest"},
        };
        app.post('/api/kg/categories/:id/metrics',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.addMetricsToCategoryWithTsoa)),

            async function CategoryController_addMetricsToCategoryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_addMetricsToCategoryWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'addMetricsToCategoryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_removeMetricFromCategoryWithTsoa: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                mid: {"in":"path","name":"mid","required":true,"dataType":"string"},
        };
        app.delete('/api/kg/categories/:id/metrics/:mid',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.removeMetricFromCategoryWithTsoa)),

            async function CategoryController_removeMetricFromCategoryWithTsoa(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_removeMetricFromCategoryWithTsoa, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'removeMetricFromCategoryWithTsoa',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
