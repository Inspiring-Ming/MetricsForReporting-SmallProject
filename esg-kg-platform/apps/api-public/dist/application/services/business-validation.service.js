export class BusinessValidationService {
    validateComputationRequest(framework, industry, entityId, asOf, inputValues) {
        const errors = [];
        if (!this.isFrameworkCompatibleWithIndustry(framework, industry)) {
            errors.push({
                code: 'FRAMEWORK_INDUSTRY_MISMATCH',
                message: `Framework ${framework} is not applicable to industry ${industry}`,
                field: 'framework'
            });
        }
        const asOfDate = new Date(asOf);
        const now = new Date();
        if (asOfDate > now) {
            errors.push({
                code: 'FUTURE_DATE_NOT_ALLOWED',
                message: 'Computation date cannot be in the future',
                field: 'asOf'
            });
        }
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(now.getFullYear() - 5);
        if (asOfDate < fiveYearsAgo) {
            errors.push({
                code: 'DATE_TOO_OLD',
                message: 'Computation date cannot be more than 5 years old',
                field: 'asOf'
            });
        }
        this.validateInputValueRanges(inputValues, errors);
        if (!this.isEntityAccessible(entityId)) {
            errors.push({
                code: 'ENTITY_ACCESS_DENIED',
                message: `Access denied to entity ${entityId}`,
                field: 'entityId'
            });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateMetricBusinessRules(framework, industry, code, value, unitIri, asOf) {
        const errors = [];
        if (!this.isValidMetricCode(framework, industry, code)) {
            errors.push({
                code: 'INVALID_METRIC_CODE',
                message: `Metric code ${code} is not valid for ${framework} framework in ${industry} industry`,
                field: 'code'
            });
        }
        if (!this.isUnitCompatibleWithMetric(code, unitIri)) {
            errors.push({
                code: 'INCOMPATIBLE_UNIT',
                message: `Unit ${unitIri} is not compatible with metric ${code}`,
                field: 'unitIri'
            });
        }
        const valueValidation = this.validateMetricValueRange(code, value);
        if (!valueValidation.valid) {
            errors.push({
                code: 'VALUE_OUT_OF_RANGE',
                message: valueValidation.message || 'Value is out of valid range',
                field: 'value'
            });
        }
        if (this.hasPeriodOverlapConflict(code, asOf)) {
            errors.push({
                code: 'PERIOD_OVERLAP_CONFLICT',
                message: `Metric ${code} already exists for overlapping period`,
                field: 'asOf'
            });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateDateRange(fromDate, toDate) {
        const errors = [];
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            if (from > to) {
                errors.push({
                    code: 'INVALID_DATE_RANGE',
                    message: 'From date cannot be after to date',
                    field: 'fromDate'
                });
            }
            const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000;
            if (to.getTime() - from.getTime() > maxRangeMs) {
                errors.push({
                    code: 'DATE_RANGE_TOO_LARGE',
                    message: 'Date range cannot exceed 2 years',
                    field: 'toDate'
                });
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    isFrameworkCompatibleWithIndustry(framework, industry) {
        const incompatibleCombinations = [
            { framework: 'SASB', industry: 'non-profit' },
            { framework: 'EU_TAXONOMY', industry: 'US-only-industry' }
        ];
        return !incompatibleCombinations.some(combo => combo.framework === framework && combo.industry === industry);
    }
    validateInputValueRanges(inputValues, errors) {
        const nonNegativeMetrics = ['revenue', 'emissions', 'energy_consumption'];
        for (const [key, value] of Object.entries(inputValues)) {
            if (nonNegativeMetrics.some(metric => key.toLowerCase().includes(metric))) {
                if (value < 0) {
                    errors.push({
                        code: 'NEGATIVE_VALUE_NOT_ALLOWED',
                        message: `${key} cannot be negative`,
                        field: key
                    });
                }
            }
            if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('rate')) {
                if (value < 0 || value > 100) {
                    errors.push({
                        code: 'INVALID_PERCENTAGE',
                        message: `${key} must be between 0 and 100`,
                        field: key
                    });
                }
            }
        }
    }
    isEntityAccessible(entityId) {
        return !entityId.startsWith('restricted_');
    }
    isValidMetricCode(_framework, _industry, code) {
        return code.length >= 3 && code.length <= 20;
    }
    isUnitCompatibleWithMetric(_code, unitIri) {
        return unitIri.startsWith('http://') || unitIri.startsWith('https://');
    }
    validateMetricValueRange(code, value) {
        if (code.includes('percentage') && (value < 0 || value > 100)) {
            return { valid: false, message: 'Percentage values must be between 0 and 100' };
        }
        return { valid: true };
    }
    hasPeriodOverlapConflict(_code, _asOf) {
        return false;
    }
}
//# sourceMappingURL=business-validation.service.js.map