export class MetricDtoMapper {
    static toCreateMetricRequest(httpRequest) {
        const result = {
            framework: httpRequest.framework,
            industry: httpRequest.industry,
            code: httpRequest.code,
            entityId: httpRequest.entityId,
            value: httpRequest.value,
            unitIri: httpRequest.unitIri,
            asOf: httpRequest.asOf,
            source: httpRequest.source
        };
        if (httpRequest.idempotencyKey) {
            result.idempotencyKey = httpRequest.idempotencyKey;
        }
        return result;
    }
    static toBatchMetricRequest(httpRequest) {
        const result = {
            metrics: httpRequest.metrics.map(metric => this.toCreateMetricRequest(metric))
        };
        if (httpRequest.idempotencyKey) {
            result.idempotencyKey = httpRequest.idempotencyKey;
        }
        return result;
    }
    static toUpdateMetricRequest(httpRequest) {
        const result = {};
        if (httpRequest.framework)
            result.framework = httpRequest.framework;
        if (httpRequest.industry)
            result.industry = httpRequest.industry;
        if (httpRequest.code)
            result.code = httpRequest.code;
        if (httpRequest.entityId)
            result.entityId = httpRequest.entityId;
        if (httpRequest.value !== undefined)
            result.value = httpRequest.value;
        if (httpRequest.unitIri)
            result.unitIri = httpRequest.unitIri;
        if (httpRequest.asOf)
            result.asOf = httpRequest.asOf;
        if (httpRequest.source)
            result.source = httpRequest.source;
        return result;
    }
    static toMetricQueryParams(httpParams) {
        const result = {};
        if (httpParams.framework)
            result.framework = httpParams.framework;
        if (httpParams.industry)
            result.industry = httpParams.industry;
        if (httpParams.entityId)
            result.entityId = httpParams.entityId;
        if (httpParams.code)
            result.code = httpParams.code;
        if (httpParams.fromDate)
            result.fromDate = httpParams.fromDate;
        if (httpParams.toDate)
            result.toDate = httpParams.toDate;
        if (httpParams.page)
            result.page = parseInt(httpParams.page, 10);
        if (httpParams.size)
            result.size = parseInt(httpParams.size, 10);
        return result;
    }
    static toHttpMetricResponse(appResponse) {
        return {
            id: appResponse.id,
            framework: appResponse.framework,
            industry: appResponse.industry,
            code: appResponse.code,
            entityId: appResponse.entityId,
            value: appResponse.value,
            unitIri: appResponse.unitIri,
            asOf: appResponse.asOf,
            source: appResponse.source,
            createdAt: appResponse.createdAt,
            updatedAt: appResponse.updatedAt
        };
    }
    static toHttpBatchMetricResponse(appResponse) {
        return {
            success: appResponse.success.map(metric => this.toHttpMetricResponse(metric)),
            failed: appResponse.failed
        };
    }
    static toHttpPaginatedResponse(appResponse) {
        return {
            data: appResponse.data.map(metric => this.toHttpMetricResponse(metric)),
            pagination: appResponse.pagination,
            timestamp: appResponse.timestamp,
            status: appResponse.status
        };
    }
    static toHttpSuccessResponse(appResponse, transformer) {
        return {
            data: transformer ? transformer(appResponse.data) : appResponse.data,
            timestamp: appResponse.timestamp,
            status: 'success'
        };
    }
    static toHttpValidationResponse(appResponse) {
        return {
            valid: appResponse.data.valid,
            errors: appResponse.data.errors,
            timestamp: appResponse.timestamp,
            status: appResponse.status
        };
    }
}
//# sourceMappingURL=metric.mapper.js.map