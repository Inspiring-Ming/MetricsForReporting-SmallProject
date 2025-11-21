import { ModelRepository } from '../../repositories/modelRepository';
import {
    ModelDTO,
    GetModelsRequest,
    CreateModelRequest,
    UpdateModelRequest,
    DeleteModelRequest,
    ModelsResponse,
    ModelDetailResponse,
    ModelDetailDTO,
    CreateModelResponse,
    UpdateModelResponse,
    DeleteModelResponse,
    ModelMetricsInputsResponse,
    ModelMetricsOutputResponse,
    UpdateModelMetricsInputsRequest,
    UpdateModelMetricsInputsResponse,
    AddModelInputMetricResponse,
    RemoveModelInputMetricResponse,
    ModelImplementationsResponse,
    AddModelImplementationResponse
} from '../../types/kg';
import { ValidationError, NotFoundError, ConflictError, DeleteConflictError } from '../../types/errors';

export class ModelService {
    private repository: ModelRepository;

    constructor(repository?: ModelRepository) {
        this.repository = repository || new ModelRepository();
    }

    /**
     * 获取模型列表
     */
    public async getModels(params: GetModelsRequest): Promise<ModelsResponse> {
        const { models, total } = await this.repository.getModels(params);

        return {
            result: models,
            page: params.page || 1,
            size: params.size || 10,
            total,
            totalPages: Math.ceil(total / (params.size || 10))
        };
    }

    /**
     * 获取模型详情
     */
    public async getModelById(id: string): Promise<ModelDetailResponse> {
        const model = await this.repository.getModelById(id);

        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        return {
            result: model
        };
    }

    /**
     * 创建模型
     */
    public async createModel(data: CreateModelRequest): Promise<CreateModelResponse> {
        // 验证必填字段
        if (!data.name) {
            throw new ValidationError('Model name is required');
        }
        if (!data.calculation_type) {
            throw new ValidationError('Calculation type is required');
        }
        if (!data.implementation) {
            throw new ValidationError('Implementation is required');
        }
        if (data.input_metrics === undefined) {
            throw new ValidationError('input_metrics field is required (can be empty array)');
        }

        // 验证所有input metrics是否存在
        if (data.input_metrics && data.input_metrics.length > 0) {
            const metricRepository = (await import('../../repositories/metricRepository')).MetricRepository;
            const metricRepo = new metricRepository();
            for (const metricId of data.input_metrics) {
                const metric = await metricRepo.getMetricById(metricId);
                if (!metric) {
                    throw new NotFoundError(`Input metric not found: ${metricId}`);
                }
            }
        }

        // 检查是否存在同名模型
        const existing = await this.repository.getModelById(data.name);
        if (existing) {
            throw new ConflictError(`Model with name "${data.name}" already exists`);
        }

        const iri = await this.repository.createModel(data);
        const created = await this.repository.getModelById(iri);

        if (!created) {
            throw new Error('Failed to retrieve created model');
        }

        return {
            iri: created.iri,
            label: created.label || '',
            calculation_type: created.calculationType || '',
            input_metrics: created.inputMetrics || [],
            implementation: created.implementation ? {
                iri: created.implementation.iri || '',
                label: created.implementation.label || ''
            } : { iri: '', label: '' },
            created_at: created.createdAt || new Date().toISOString()
        };
    }

    /**
     * 更新模型
     */
    public async updateModel(id: string, data: UpdateModelRequest): Promise<UpdateModelResponse> {
        const existing = await this.repository.getModelById(id);
        if (!existing) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        // 验证至少提供一个字段
        const hasAnyField = data.label !== undefined || 
                           data.calculation_type !== undefined || 
                           data.input_metrics !== undefined || 
                           data.implementation !== undefined || 
                           data.description !== undefined || 
                           data.formula !== undefined || 
                           data.mathematical_expression !== undefined;
        
        if (!hasAnyField) {
            throw new ValidationError('At least one field must be provided for update');
        }

        // 验证所有input metrics是否存在
        if (data.input_metrics !== undefined) {
            const metricRepository = (await import('../../repositories/metricRepository')).MetricRepository;
            const metricRepo = new metricRepository();
            for (const metricId of data.input_metrics) {
                const metric = await metricRepo.getMetricById(metricId);
                if (!metric) {
                    throw new NotFoundError(`Input metric not found: ${metricId}`);
                }
            }
        }

        await this.repository.updateModel(id, data);
        const updated = await this.repository.getModelById(id);

        if (!updated) {
            throw new Error('Failed to retrieve updated model');
        }

        return {
            iri: updated.iri,
            label: updated.label || '',
            inputMetrics: updated.inputMetrics || [],
            updated_at: updated.updatedAt || new Date().toISOString()
        };
    }

    /**
     * 删除模型
     */
    public async deleteModel(id: string, options: DeleteModelRequest): Promise<DeleteModelResponse> {
        const existing = await this.repository.getModelById(id);
        if (!existing) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        try {
            await this.repository.deleteModel(id, options);
        } catch (error) {
            if (error instanceof DeleteConflictError) {
                throw error;
            }
            throw error;
        }

        return {
            iri: id,
            deleted: true,
            deleted_at: new Date().toISOString()
        };
    }

    /**
     * 获取模型的输入指标列表
     */
    public async getModelInputMetrics(id: string): Promise<ModelMetricsInputsResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        const inputs = await this.repository.getModelInputMetrics(model.iri);

        return {
            modelId: model.iri,
            modelLabel: model.label || '',
            inputs: inputs,
            total: inputs.length
        };
    }

    /**
     * 获取模型的输出指标
     */
    public async getModelOutputMetric(id: string): Promise<ModelMetricsOutputResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        const output = await this.repository.getModelOutputMetric(model.iri);

        return {
            modelId: model.iri,
            modelLabel: model.label || '',
            output: output
        };
    }

    /**
     * 更新模型的输入指标列表
     */
    public async updateModelInputMetrics(id: string, data: UpdateModelMetricsInputsRequest): Promise<UpdateModelMetricsInputsResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        // 验证输入
        if (!data.inputs || !Array.isArray(data.inputs)) {
            throw new ValidationError('inputs must be an array');
        }

        if (data.inputs.length === 0) {
            throw new ValidationError('At least one input metric is required');
        }

        // 更新输入指标
        await this.repository.updateModelInputMetrics(model.iri, data.inputs);

        // 获取更新后的输入指标列表
        const updatedInputs = await this.repository.getModelInputMetrics(model.iri);

        return {
            modelId: model.iri,
            inputs: updatedInputs.map(input => ({
                iri: input.iri,
                label: input.label
            })),
            updated_at: new Date().toISOString()
        };
    }

    /**
     * 添加单个输入指标到模型
     */
    public async addModelInputMetric(id: string, metricId: string): Promise<AddModelInputMetricResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        // 验证指标ID
        if (!metricId) {
            throw new ValidationError('Metric ID is required');
        }

        // 添加输入指标
        await this.repository.addModelInputMetric(model.iri, metricId);

        return {
            model_iri: model.iri,
            metric_iri: metricId.startsWith('http://') ? metricId : `http://example.org/esg#${metricId}`,
            added_at: new Date().toISOString()
        };
    }

    /**
     * 从模型移除单个输入指标
     */
    public async removeModelInputMetric(id: string, metricId: string): Promise<RemoveModelInputMetricResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        // 验证指标ID
        if (!metricId) {
            throw new ValidationError('Metric ID is required');
        }

        // 移除输入指标
        await this.repository.removeModelInputMetric(model.iri, metricId);

        return {
            model_iri: model.iri,
            metric_iri: metricId.startsWith('http://') ? metricId : `http://example.org/esg#${metricId}`,
            removed_at: new Date().toISOString()
        };
    }

    /**
     * 获取模型的实现列表
     */
    public async getModelImplementations(id: string): Promise<ModelImplementationsResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        const implementations = await this.repository.getModelImplementations(model.iri);

        return {
            modelId: model.iri,
            modelLabel: model.label || '',
            implementations: implementations,
            total: implementations.length
        };
    }

    /**
     * 添加实现到模型
     */
    public async addModelImplementation(id: string, implementationId: string): Promise<AddModelImplementationResponse> {
        // 验证模型是否存在
        const model = await this.repository.getModelById(id);
        if (!model) {
            throw new NotFoundError(`Model not found: ${id}`);
        }

        // 验证实现ID
        if (!implementationId) {
            throw new ValidationError('Implementation ID is required');
        }

        // 添加实现
        await this.repository.addModelImplementation(model.iri, implementationId);

        return {
            model_iri: model.iri,
            implementation_iri: implementationId.startsWith('http://') ? implementationId : `http://example.org/esg#${implementationId}`,
            added_at: new Date().toISOString()
        };
    }
}
