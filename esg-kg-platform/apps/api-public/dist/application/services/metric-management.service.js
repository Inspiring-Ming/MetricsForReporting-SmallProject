export class MetricManagementService {
    metricRepository;
    cache;
    constructor(metricRepository, cache) {
        this.metricRepository = metricRepository;
        this.cache = cache;
    }
    async createMetric(request) {
        try {
            const timestamp = new Date().toISOString();
            const validationResult = this.validateCreateRequest(request);
            if (!validationResult.valid) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const existingMetric = await this.findDuplicateMetric(request);
            if (existingMetric) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const savedId = await this.metricRepository.save(request);
            await this.invalidateRelatedCache(request);
            const response = {
                ...request,
                id: savedId,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            return {
                data: response,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to create metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createMetricsBatch(request) {
        const timestamp = new Date().toISOString();
        const successResults = [];
        const failedResults = [];
        for (let i = 0; i < request.metrics.length; i++) {
            const metricRequest = request.metrics[i];
            if (!metricRequest) {
                failedResults.push({
                    index: i,
                    errors: [{
                            field: 'general',
                            code: 'INVALID_REQUEST',
                            message: 'Metric request is null or undefined'
                        }]
                });
                continue;
            }
            try {
                const result = await this.createMetric(metricRequest);
                if (result.status === 'success' && result.data) {
                    successResults.push(result.data);
                }
                else {
                    failedResults.push({
                        index: i,
                        errors: [{
                                field: 'general',
                                code: 'VALIDATION_FAILED',
                                message: 'Metric validation failed'
                            }]
                    });
                }
            }
            catch (error) {
                failedResults.push({
                    index: i,
                    errors: [{
                            field: 'general',
                            code: 'PROCESSING_ERROR',
                            message: error instanceof Error ? error.message : 'Unknown error'
                        }]
                });
            }
        }
        const batchResponse = {
            success: successResults,
            failed: failedResults
        };
        return {
            data: batchResponse,
            timestamp,
            status: 'success'
        };
    }
    async queryMetrics(params) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = this.buildCacheKey('metrics-query', params);
            const cached = await this.cache.get(cacheKey);
            let metricsData;
            if (cached) {
                metricsData = cached;
            }
            else {
                metricsData = await this.metricRepository.findMany(params);
                await this.cache.set(cacheKey, metricsData, 300);
            }
            const metricResponses = metricsData.metrics.map(dto => ({
                ...dto,
                id: this.generateIdFromDto(dto),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            return {
                data: metricResponses,
                timestamp,
                status: 'success',
                pagination: {
                    page: params.page || 1,
                    size: params.size || 10,
                    total: metricsData.totalCount,
                    hasNext: this.calculateHasNext(params, metricsData.totalCount)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to query metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getMetricById(id) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `metric:${id}`;
            const cached = await this.cache.get(cacheKey);
            let metricDto;
            if (cached) {
                metricDto = cached;
            }
            else {
                metricDto = await this.metricRepository.findById(id);
                if (metricDto) {
                    await this.cache.set(cacheKey, metricDto, 600);
                }
            }
            if (!metricDto) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const response = {
                ...metricDto,
                id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return {
                data: response,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateMetric(id, request) {
        const timestamp = new Date().toISOString();
        try {
            const validationResult = this.validateUpdateRequest(request);
            if (!validationResult.valid) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const success = await this.metricRepository.update(id, request);
            if (!success) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const updatedMetric = await this.metricRepository.findById(id);
            if (!updatedMetric) {
                throw new Error('Failed to retrieve updated metric');
            }
            await this.cache.delete(`metric:${id}`);
            const response = {
                ...updatedMetric,
                id,
                createdAt: new Date().toISOString(),
                updatedAt: timestamp
            };
            return {
                data: response,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to update metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteMetric(id) {
        const timestamp = new Date().toISOString();
        try {
            const success = await this.metricRepository.delete(id);
            if (success) {
                await this.cache.delete(`metric:${id}`);
            }
            return {
                data: undefined,
                timestamp,
                status: success ? 'success' : 'error'
            };
        }
        catch (error) {
            throw new Error(`Failed to delete metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateMetric(metric) {
        const timestamp = new Date().toISOString();
        try {
            const validationResult = this.validateMetricData(metric);
            return {
                data: {
                    valid: validationResult.valid,
                    errors: validationResult.errors
                },
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to validate metric: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateCreateRequest(request) {
        const errors = [];
        if (!request.framework || request.framework.trim() === '') {
            errors.push('Framework is required');
        }
        if (!request.industry || request.industry.trim() === '') {
            errors.push('Industry is required');
        }
        if (!request.code || request.code.trim() === '') {
            errors.push('Code is required');
        }
        if (!request.entityId || request.entityId.trim() === '') {
            errors.push('EntityId is required');
        }
        if (request.value === null || request.value === undefined) {
            errors.push('Value is required');
        }
        if (typeof request.value === 'number' && (isNaN(request.value) || !isFinite(request.value))) {
            errors.push('Value must be a valid number');
        }
        if (!request.unitIri || request.unitIri.trim() === '') {
            errors.push('UnitIri is required');
        }
        if (!request.asOf || request.asOf.trim() === '') {
            errors.push('AsOf date is required');
        }
        if (!request.source || request.source.trim() === '') {
            errors.push('Source is required');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateUpdateRequest(updates) {
        const errors = [];
        if (updates.value !== undefined) {
            if (typeof updates.value === 'number' && (isNaN(updates.value) || !isFinite(updates.value))) {
                errors.push('Value must be a valid number');
            }
        }
        if (updates.framework !== undefined && (!updates.framework || updates.framework.trim() === '')) {
            errors.push('Framework cannot be empty');
        }
        if (updates.industry !== undefined && (!updates.industry || updates.industry.trim() === '')) {
            errors.push('Industry cannot be empty');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateMetricData(metric) {
        const errors = [];
        if (!metric.framework)
            errors.push('Framework is required');
        if (!metric.industry)
            errors.push('Industry is required');
        if (!metric.code)
            errors.push('Code is required');
        if (!metric.entityId)
            errors.push('EntityId is required');
        if (metric.value === null || metric.value === undefined)
            errors.push('Value is required');
        if (!metric.unitIri)
            errors.push('UnitIri is required');
        if (!metric.asOf)
            errors.push('AsOf is required');
        if (!metric.source)
            errors.push('Source is required');
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async findDuplicateMetric(request) {
        const queryParams = {
            framework: request.framework,
            industry: request.industry,
            code: request.code,
            entityId: request.entityId,
            size: 1
        };
        const result = await this.metricRepository.findMany(queryParams);
        return result.metrics.length > 0 ? result.metrics[0] || null : null;
    }
    async invalidateRelatedCache(request) {
        const patterns = [
            `metrics-query:${request.framework}:${request.industry}`,
            `metrics-query:${request.framework}`,
            'metrics-query:all'
        ];
        for (const pattern of patterns) {
            try {
                await this.cache.delete(pattern);
            }
            catch (error) {
            }
        }
    }
    buildCacheKey(prefix, params) {
        const keyParts = [prefix];
        if (params.framework)
            keyParts.push(`fw:${params.framework}`);
        if (params.industry)
            keyParts.push(`ind:${params.industry}`);
        if (params.code)
            keyParts.push(`code:${params.code}`);
        if (params.entityId)
            keyParts.push(`entity:${params.entityId}`);
        if (params.page)
            keyParts.push(`page:${params.page}`);
        if (params.size)
            keyParts.push(`size:${params.size}`);
        return keyParts.join(':');
    }
    calculateHasNext(params, totalCount) {
        const page = params.page || 1;
        const size = params.size || 10;
        return (page * size) < totalCount;
    }
    generateIdFromDto(dto) {
        const parts = [dto.framework, dto.industry, dto.code, dto.entityId, dto.asOf];
        return parts.join('::');
    }
}
//# sourceMappingURL=metric-management.service.js.map