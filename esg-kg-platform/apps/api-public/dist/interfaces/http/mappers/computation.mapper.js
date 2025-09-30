export class ComputationDtoMapper {
    static toComputationRequest(httpRequest) {
        return {
            framework: httpRequest.framework,
            industry: httpRequest.industry,
            code: 'COMPUTE',
            entityId: httpRequest.entityId,
            inputValues: httpRequest.inputs,
            asOf: httpRequest.asOf,
            source: 'api-public'
        };
    }
    static toMethodsQuery(httpRequest) {
        return {
            framework: httpRequest.framework,
            industry: httpRequest.industry,
            metricCode: httpRequest.metricCode
        };
    }
    static toDiscoverMethodsQuery(queryParams) {
        return {
            framework: queryParams.framework,
            industry: queryParams.industry
        };
    }
    static toHttpComputationResponse(appResponse) {
        const data = appResponse.data;
        return {
            result: data.value,
            formula: data.method.formula || 'N/A',
            inputs: data.inputValues,
            metadata: {
                framework: 'SASB',
                industry: 'Banking',
                entityId: 'entity-id',
                asOf: 'as-of-date',
                computedAt: data.computedAt
            }
        };
    }
    static toHttpComputationMethod(method) {
        return {
            methodId: method.code,
            formula: method.formula || 'N/A',
            requiredInputs: method.inputMetrics.map(input => input.code || input.name),
            description: method.description,
            priority: 1
        };
    }
    static toHttpDiscoverMethodsResponse(methodsOrResponse, metricCode, framework, industry) {
        if (Array.isArray(methodsOrResponse)) {
            return {
                methods: methodsOrResponse.map(method => this.toHttpComputationMethod(method)),
                metricCode: metricCode,
                framework: framework,
                industry: industry
            };
        }
        else {
            const response = methodsOrResponse;
            return {
                methods: response.data.map(method => this.toHttpComputationMethod(method)),
                metricCode: 'GENERIC',
                framework: 'SASB',
                industry: 'Generic'
            };
        }
    }
}
//# sourceMappingURL=computation.mapper.js.map