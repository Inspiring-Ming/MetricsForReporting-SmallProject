export class ComputationManagementService {
    knowledgeGraph;
    cache;
    constructor(knowledgeGraph, cache) {
        this.knowledgeGraph = knowledgeGraph;
        this.cache = cache;
    }
    async getComputationMethods(framework, industry) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `computation-methods:${framework}:${industry}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const methods = await this.knowledgeGraph.getComputationMethods(framework, industry);
            await this.cache.set(cacheKey, methods, 3600);
            return {
                data: methods,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get computation methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getComputationMethod(framework, industry, code) {
        const timestamp = new Date().toISOString();
        try {
            const cacheKey = `computation-method:${framework}:${industry}:${code}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    timestamp,
                    status: 'success'
                };
            }
            const method = await this.knowledgeGraph.getComputationMethod(framework, industry, code);
            if (!method) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            await this.cache.set(cacheKey, method, 7200);
            return {
                data: method,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to get computation method: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeComputation(request) {
        const timestamp = new Date().toISOString();
        try {
            const validationResult = this.validateComputationRequest(request);
            if (!validationResult.valid) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const methodResult = await this.getComputationMethod(request.framework, request.industry, request.code);
            if (methodResult.status !== 'success' || !methodResult.data) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const method = methodResult.data;
            const inputValidation = this.validateInputsAgainstMethod(request.inputValues, method);
            if (!inputValidation.valid) {
                return {
                    data: null,
                    timestamp,
                    status: 'error'
                };
            }
            const computationValue = this.executeComputationLogic(method, request.inputValues);
            const result = {
                computationId: `comp_${Date.now()}_${request.entityId}`,
                value: computationValue,
                unitIri: method.outputUnit,
                computedAt: timestamp,
                method: {
                    code: method.code,
                    modelName: method.modelName || method.name,
                    ...(method.formula && { formula: method.formula }),
                    version: '1.0'
                },
                inputValues: request.inputValues,
                duration: 50
            };
            return {
                data: result,
                timestamp,
                status: 'success'
            };
        }
        catch (error) {
            throw new Error(`Failed to execute computation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateComputationInputs(framework, industry, code, inputValues) {
        const timestamp = new Date().toISOString();
        try {
            const methodResult = await this.getComputationMethod(framework, industry, code);
            if (methodResult.status !== 'success' || !methodResult.data) {
                return {
                    data: {
                        valid: false,
                        errors: ['Computation method not found']
                    },
                    timestamp,
                    status: 'error'
                };
            }
            const validationResult = this.validateInputsAgainstMethod(inputValues, methodResult.data);
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
            throw new Error(`Failed to validate computation inputs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getComputationHistory(entityId, framework, fromDate, toDate) {
        const timestamp = new Date().toISOString();
        try {
            if (!entityId || entityId.trim() === '') {
                throw new Error('EntityId is required for computation history query');
            }
            if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
                throw new Error('fromDate cannot be after toDate');
            }
            if (framework && !this.isValidFramework(framework)) {
                throw new Error(`Invalid framework: ${framework}`);
            }
            return {
                data: [],
                timestamp,
                status: 'success',
                pagination: {
                    page: 1,
                    size: 10,
                    total: 0,
                    hasNext: false
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to get computation history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateComputationRequest(request) {
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
        if (!request.inputValues || Object.keys(request.inputValues).length === 0) {
            errors.push('InputValues are required');
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
    validateInputsAgainstMethod(inputValues, method) {
        const errors = [];
        if (method.inputMetrics) {
            for (const requiredInput of method.inputMetrics) {
                if (requiredInput.required && !(requiredInput.name in inputValues)) {
                    errors.push(`Required input '${requiredInput.name}' is missing`);
                }
                if (requiredInput.name in inputValues) {
                    const value = inputValues[requiredInput.name];
                    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                        errors.push(`Input '${requiredInput.name}' must be a valid number`);
                    }
                    else {
                        if (requiredInput.constraints) {
                            const constraints = requiredInput.constraints;
                            if (constraints.min !== undefined && value < constraints.min) {
                                errors.push(`Input '${requiredInput.name}' must be at least ${constraints.min}`);
                            }
                            if (constraints.max !== undefined && value > constraints.max) {
                                errors.push(`Input '${requiredInput.name}' must be at most ${constraints.max}`);
                            }
                        }
                    }
                }
            }
        }
        const validInputNames = method.inputMetrics?.map(input => input.name) || [];
        for (const inputName of Object.keys(inputValues)) {
            if (!validInputNames.includes(inputName)) {
                errors.push(`Unexpected input '${inputName}' provided`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    executeComputationLogic(method, inputValues) {
        if (method.implementedBy === 'platform' && method.formula) {
            return this.executePlatformFormula(method.formula, inputValues);
        }
        const values = Object.values(inputValues);
        return values.reduce((sum, val) => sum + val, 0);
    }
    executePlatformFormula(formula, inputValues) {
        let result = formula;
        for (const [varName, value] of Object.entries(inputValues)) {
            const regex = new RegExp(`\\b${varName}\\b`, 'g');
            result = result.replace(regex, value.toString());
        }
        try {
            return this.evaluateMathExpression(result);
        }
        catch (error) {
            throw new Error(`Failed to evaluate formula: ${formula}`);
        }
    }
    evaluateMathExpression(expression) {
        expression = expression.replace(/\s+/g, '');
        if (!/^[0-9+\-*/().]+$/.test(expression)) {
            throw new Error('Invalid characters in mathematical expression');
        }
        try {
            return Function(`"use strict"; return (${expression})`)();
        }
        catch (error) {
            throw new Error('Invalid mathematical expression');
        }
    }
    isValidFramework(framework) {
        const validFrameworks = ['SASB', 'GRI', 'TCFD', 'EU_TAXONOMY'];
        return validFrameworks.includes(framework);
    }
}
//# sourceMappingURL=computation-management.service.js.map