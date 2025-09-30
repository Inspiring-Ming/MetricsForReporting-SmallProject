/**
 * Business Validation Service
 * Handles domain-specific validation rules and constraints
 */

import { Framework } from '@esg-platform/dto';

export interface BusinessValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface BusinessValidationResult {
  valid: boolean;
  errors: BusinessValidationError[];
}

export class BusinessValidationService {
  /**
   * Validate computation business rules
   */
  validateComputationRequest(
    framework: Framework,
    industry: string,
    entityId: string,
    asOf: string,
    inputValues: Record<string, number>
  ): BusinessValidationResult {
    const errors: BusinessValidationError[] = [];

    // Business rule: Check framework compatibility with industry
    if (!this.isFrameworkCompatibleWithIndustry(framework, industry)) {
      errors.push({
        code: 'FRAMEWORK_INDUSTRY_MISMATCH',
        message: `Framework ${framework} is not applicable to industry ${industry}`,
        field: 'framework'
      });
    }

    // Business rule: Validate computation date constraints
    const asOfDate = new Date(asOf);
    const now = new Date();
    
    if (asOfDate > now) {
      errors.push({
        code: 'FUTURE_DATE_NOT_ALLOWED',
        message: 'Computation date cannot be in the future',
        field: 'asOf'
      });
    }

    // Business rule: Check if computation date is too old (e.g., more than 5 years)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    
    if (asOfDate < fiveYearsAgo) {
      errors.push({
        code: 'DATE_TOO_OLD',
        message: 'Computation date cannot be more than 5 years old',
        field: 'asOf'
      });
    }

    // Business rule: Validate input value ranges based on domain knowledge
    this.validateInputValueRanges(inputValues, errors);

    // Business rule: Check entity existence and access permissions
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

  /**
   * Validate metric business rules
   */
  validateMetricBusinessRules(
    framework: Framework,
    industry: string,
    code: string,
    value: number,
    unitIri: string,
    asOf: string
  ): BusinessValidationResult {
    const errors: BusinessValidationError[] = [];

    // Business rule: Validate metric code exists for framework/industry combination
    if (!this.isValidMetricCode(framework, industry, code)) {
      errors.push({
        code: 'INVALID_METRIC_CODE',
        message: `Metric code ${code} is not valid for ${framework} framework in ${industry} industry`,
        field: 'code'
      });
    }

    // Business rule: Validate unit compatibility with metric
    if (!this.isUnitCompatibleWithMetric(code, unitIri)) {
      errors.push({
        code: 'INCOMPATIBLE_UNIT',
        message: `Unit ${unitIri} is not compatible with metric ${code}`,
        field: 'unitIri'
      });
    }

    // Business rule: Validate value range based on metric definition
    const valueValidation = this.validateMetricValueRange(code, value);
    if (!valueValidation.valid) {
      errors.push({
        code: 'VALUE_OUT_OF_RANGE',
        message: valueValidation.message || 'Value is out of valid range',
        field: 'value'
      });
    }

    // Business rule: Check for period overlap conflicts
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

  /**
   * Validate date range business rules
   */
  validateDateRange(fromDate?: string, toDate?: string): BusinessValidationResult {
    const errors: BusinessValidationError[] = [];

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Business rule: fromDate cannot be after toDate
      if (from > to) {
        errors.push({
          code: 'INVALID_DATE_RANGE',
          message: 'From date cannot be after to date',
          field: 'fromDate'
        });
      }

      // Business rule: Date range cannot exceed maximum allowed period (e.g., 2 years)
      const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
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

  // Private helper methods for business rules

  private isFrameworkCompatibleWithIndustry(framework: Framework, industry: string): boolean {
    // Mock implementation - would check against actual framework/industry compatibility matrix
    const incompatibleCombinations = [
      { framework: 'SASB', industry: 'non-profit' },
      { framework: 'EU_TAXONOMY', industry: 'US-only-industry' }
    ];

    return !incompatibleCombinations.some(
      combo => combo.framework === framework && combo.industry === industry
    );
  }

  private validateInputValueRanges(
    inputValues: Record<string, number>, 
    errors: BusinessValidationError[]
  ): void {
    // Business rule: All values must be non-negative for certain metrics
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

      // Business rule: Percentage values must be between 0 and 100
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

  private isEntityAccessible(entityId: string): boolean {
    // Mock implementation - would check against actual entity permissions
    return !entityId.startsWith('restricted_');
  }

  private isValidMetricCode(_framework: Framework, _industry: string, code: string): boolean {
    // Mock implementation - would check against actual metric registry
    return code.length >= 3 && code.length <= 20;
  }

  private isUnitCompatibleWithMetric(_code: string, unitIri: string): boolean {
    // Mock implementation - would check against unit compatibility rules
    return unitIri.startsWith('http://') || unitIri.startsWith('https://');
  }

  private validateMetricValueRange(code: string, value: number): { valid: boolean; message?: string } {
    // Mock implementation - would check against metric-specific value ranges
    if (code.includes('percentage') && (value < 0 || value > 100)) {
      return { valid: false, message: 'Percentage values must be between 0 and 100' };
    }
    
    return { valid: true };
  }

  private hasPeriodOverlapConflict(_code: string, _asOf: string): boolean {
    // Mock implementation - would check against existing metrics for period overlap
    return false;
  }
}