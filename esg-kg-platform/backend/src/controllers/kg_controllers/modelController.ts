import { Request, Response } from 'express';
import { Route, Get, Post, Put, Delete, Tags, Query, Path, Body, SuccessResponse, Response as TsoaResponse } from 'tsoa';
import { ModelService } from '../../services/kg_services/modelService';
import {
    GetModelsRequest,
    CreateModelRequest,
    UpdateModelRequest,
    DeleteModelRequest,
    ModelsResponse,
    ModelDetailResponse,
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
    AddModelImplementationResponse,
    AddModelImplementationRequest
} from '../../types/kg';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError } from '../../types/errors';

/**
 * Model Controller - Handles model-related HTTP requests
 */
@Route('api/kg/models')
@Tags('Models')
export class ModelController {
    private service: ModelService;

    constructor(service?: ModelService) {
        this.service = service || new ModelService();
    }

    /**
     * Get model list (supports pagination and search)
     * 
     * @param page Page number (starting from 1, default 1)
     * @param size Items per page (default 10, max 100)
     * @param search Search keyword (fuzzy match on label)
     * @param calculationType Filter by calculation type (optional)
     * @param sort Sort field (default label)
     * @param order Sort order (default asc)
     * @returns Model list and pagination information
     */
    @Get('/')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async getModelsWithTsoa(
        @Query() page?: number,
        @Query() size?: number,
        @Query() search?: string,
        @Query() calculationType?: string,
        @Query() sort?: 'label' | 'createdAt',
        @Query() order?: 'asc' | 'desc'
    ): Promise<ModelsResponse> {
        const params: GetModelsRequest = { page, size, search, calculationType, sort, order };
        return await this.service.getModels(params);
    }

    // Express 兼容方法
    getModels = asyncHandler(async (req: Request, res: Response) => {
        const params: GetModelsRequest = {
            page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
            size: req.query.size ? parseInt(req.query.size as string, 10) : undefined,
            search: req.query.search as string,
            calculationType: req.query.calculationType as string,
            sort: req.query.sort as 'label' | 'createdAt',
            order: req.query.order as 'asc' | 'desc'
        };
        const result = await this.service.getModels(params);
        res.json(result);
    });

    /**
     * Get model details
     * 
     * @param id Model ID (URI format or short ID)
     * @returns Model details
     */
    @Get('{id}')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async getModelByIdWithTsoa(
        @Path() id: string
    ): Promise<ModelDetailResponse> {
        return await this.service.getModelById(id);
    }

    // Express 兼容方法
    getModelById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.getModelById(id);
        res.json(result);
    });

    /**
     * Create a new model
     * 
     * @param requestBody Request data for creating a model
     * @returns Created model information
     */
    @Post('/')
    @SuccessResponse('201', 'Created')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('409', 'Conflict - Model already exists')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async createModelWithTsoa(
        @Body() requestBody: CreateModelRequest
    ): Promise<CreateModelResponse> {
        return await this.service.createModel(requestBody);
    }

    // Express 兼容方法
    createModel = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.service.createModel(req.body);
        res.status(201).json(result);
    });

    /**
     * Update a model
     * 
     * @param id Model ID
     * @param requestBody Request data for updating the model
     * @returns Updated model information
     */
    @Put('{id}')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async updateModelWithTsoa(
        @Path() id: string,
        @Body() requestBody: UpdateModelRequest
    ): Promise<UpdateModelResponse> {
        return await this.service.updateModel(id, requestBody);
    }

    // Express 兼容方法
    updateModel = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.updateModel(id, req.body);
        res.json(result);
    });

    /**
     * Delete a model
     * 
     * @param id Model ID
     * @param force Force delete (ignore dependency checks, default false)
     * @returns Delete result
     */
    @Delete('{id}')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async deleteModelWithTsoa(
        @Path() id: string,
        @Query() force?: boolean
    ): Promise<DeleteModelResponse> {
        return await this.service.deleteModel(id, { force });
    }

    // Express 兼容方法
    deleteModel = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const force = req.query.force === 'true';
        const result = await this.service.deleteModel(id, { force });
        res.json(result);
    });

    /**
     * Get input metrics for a model
     * 
     * Returns all metrics that are used as inputs for this model (via esg:requiresInputFrom).
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @returns List of input metrics
     */
    @Get('{id}/metrics/inputs')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async getModelInputMetricsWithTsoa(
        @Path() id: string
    ): Promise<ModelMetricsInputsResponse> {
        return await this.service.getModelInputMetrics(id);
    }

    // Express compatible method
    getModelInputMetrics = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.getModelInputMetrics(id);
        res.json(result);
    });

    /**
     * Get output metric for a model
     * 
     * Returns the metric that is calculated by this model (via esg:isCalculatedBy).
     * A model can only have one output metric.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @returns Output metric information
     */
    @Get('{id}/metrics/output')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async getModelOutputMetricWithTsoa(
        @Path() id: string
    ): Promise<ModelMetricsOutputResponse> {
        return await this.service.getModelOutputMetric(id);
    }

    // Express compatible method
    getModelOutputMetric = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.getModelOutputMetric(id);
        res.json(result);
    });

    /**
     * Update input metrics for a model
     * 
     * Replaces all existing input metrics with the provided list.
     * This updates the esg:requiresInputFrom relationships.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @param requestBody Request body containing the list of input metric identifiers
     * @returns Updated input metrics information
     */
    @Put('{id}/metrics/inputs')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async updateModelInputMetricsWithTsoa(
        @Path() id: string,
        @Body() requestBody: UpdateModelMetricsInputsRequest
    ): Promise<UpdateModelMetricsInputsResponse> {
        return await this.service.updateModelInputMetrics(id, requestBody);
    }

    // Express compatible method
    updateModelInputMetrics = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.updateModelInputMetrics(id, req.body);
        res.json(result);
    });

    /**
     * Add a single input metric to model
     * 
     * Adds one metric to the model's input metrics list without affecting other inputs.
     * This creates a new esg:requiresInputFrom relationship.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @param metricId Metric identifier to add as input
     * @returns Added metric information with timestamp
     */
    @Post('{id}/metrics/inputs/{metricId}')
    @SuccessResponse('201', 'Created')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async addModelInputMetricWithTsoa(
        @Path() id: string,
        @Path() metricId: string
    ): Promise<AddModelInputMetricResponse> {
        return await this.service.addModelInputMetric(id, metricId);
    }

    // Express compatible method
    addModelInputMetric = asyncHandler(async (req: Request, res: Response) => {
        const { id, metricId } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        if (!metricId) {
            throw new ValidationError('Metric ID is required');
        }
        const result = await this.service.addModelInputMetric(id, metricId);
        res.status(201).json(result);
    });

    /**
     * Remove a single input metric from model
     * 
     * Removes one metric from the model's input metrics list without affecting other inputs.
     * This deletes the esg:requiresInputFrom relationship.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @param metricId Metric identifier to remove from inputs
     * @returns Removed metric information with timestamp
     */
    @Delete('{id}/metrics/inputs/{metricId}')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async removeModelInputMetricWithTsoa(
        @Path() id: string,
        @Path() metricId: string
    ): Promise<RemoveModelInputMetricResponse> {
        return await this.service.removeModelInputMetric(id, metricId);
    }

    // Express compatible method
    removeModelInputMetric = asyncHandler(async (req: Request, res: Response) => {
        const { id, metricId } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        if (!metricId) {
            throw new ValidationError('Metric ID is required');
        }
        const result = await this.service.removeModelInputMetric(id, metricId);
        res.json(result);
    });

    /**
     * Get model implementations
     * 
     * Returns all implementations associated with this model via esg:executesWith.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @returns List of implementations for the model
     */
    @Get('{id}/implementations')
    @SuccessResponse('200', 'Success')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async getModelImplementationsWithTsoa(
        @Path() id: string
    ): Promise<ModelImplementationsResponse> {
        return await this.service.getModelImplementations(id);
    }

    // Express compatible method
    getModelImplementations = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        const result = await this.service.getModelImplementations(id);
        res.json(result);
    });

    /**
     * Add implementation to model
     * 
     * Associates an implementation with the model via esg:executesWith relationship.
     * 
     * @param id Model identifier (IRI, label, or short ID)
     * @param requestBody Request body containing implementation identifier
     * @returns Added implementation information with timestamp
     */
    @Post('{id}/implementations')
    @SuccessResponse('201', 'Created')
    @TsoaResponse<{ error: string }>('400', 'Validation Error')
    @TsoaResponse<{ error: string }>('404', 'Model not found')
    @TsoaResponse<{ error: string }>('500', 'Internal Server Error')
    public async addModelImplementationWithTsoa(
        @Path() id: string,
        @Body() requestBody: AddModelImplementationRequest
    ): Promise<AddModelImplementationResponse> {
        return await this.service.addModelImplementation(id, requestBody.implementationId);
    }

    // Express compatible method
    addModelImplementation = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Model ID is required');
        }
        if (!req.body.implementationId) {
            throw new ValidationError('Implementation ID is required');
        }
        const result = await this.service.addModelImplementation(id, req.body.implementationId);
        res.status(201).json(result);
    });
}
