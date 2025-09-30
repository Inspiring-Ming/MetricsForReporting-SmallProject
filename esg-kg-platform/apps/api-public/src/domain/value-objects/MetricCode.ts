/**
 * MetricCode Value Object - ESG指标代码
 * 
 * 职责：
 * - 封装指标代码的验证逻辑
 * - 支持不同框架的代码格式
 * - 确保代码格式的正确性和一致性
 */

import { ValidationError } from '../errors/domain-errors';

export type Framework = 'SASB' | 'GRI' | 'TCFD' | 'EU_TAXONOMY' | 'CSRD';

/**
 * 指标代码值对象
 * 
 * 不同框架有不同的代码格式要求：
 * - SASB: 格式如 "RT-AE-130a.1", "FB-FR-270a.2"
 * - GRI: 格式如 "305-1", "401-1" 
 * - TCFD: 通常为描述性代码
 * - EU_TAXONOMY: 欧盟分类法代码
 * - CSRD: 欧盟可持续发展报告指令代码
 */
export class MetricCode {
  private readonly _value: string;
  private readonly _framework: Framework;

  constructor(value: string, framework: Framework) {
    this.validateCode(value, framework);
    this._value = value.trim();
    this._framework = framework;
  }

  get value(): string {
    return this._value;
  }

  get framework(): Framework {
    return this._framework;
  }

  /**
   * 检查代码是否符合框架规范
   */
  isValidForFramework(): boolean {
    return this.validateFrameworkFormat(this._value, this._framework);
  }

  /**
   * 获取代码的主要类别部分
   * 例如：SASB "RT-AE-130a.1" -> "RT-AE"
   *      GRI "305-1" -> "305"
   */
  getCategory(): string {
    switch (this._framework) {
      case 'SASB':
        const sasbParts = this._value.split('-');
        if (sasbParts.length >= 2) {
          return `${sasbParts[0]}-${sasbParts[1]}`;
        }
        return this._value;
      
      case 'GRI':
        const griParts = this._value.split('-');
        return griParts[0] || this._value;
      
      default:
        return this._value;
    }
  }

  /**
   * 获取代码的指标编号部分
   * 例如：SASB "RT-AE-130a.1" -> "130a.1"
   *      GRI "305-1" -> "1"
   */
  getMetricNumber(): string {
    switch (this._framework) {
      case 'SASB':
        const sasbParts = this._value.split('-');
        if (sasbParts.length >= 3) {
          return sasbParts.slice(2).join('-');
        }
        return this._value;
      
      case 'GRI':
        const griParts = this._value.split('-');
        return griParts[1] || this._value;
      
      default:
        return this._value;
    }
  }

  /**
   * 检查是否为同一指标代码
   */
  equals(other: MetricCode): boolean {
    return this._value === other._value && this._framework === other._framework;
  }

  /**
   * 转换为字符串表示
   */
  toString(): string {
    return this._value;
  }

  /**
   * 创建代码的规范化版本（用于比较和索引）
   */
  toNormalizedString(): string {
    return `${this._framework}:${this._value}`;
  }

  // 静态工厂方法

  /**
   * 从字符串创建MetricCode
   */
  static fromString(value: string, framework: Framework): MetricCode {
    return new MetricCode(value, framework);
  }

  /**
   * 尝试从代码字符串自动识别框架
   */
  static tryParseFramework(value: string): Framework | null {
    // SASB pattern: sector-industry-code format
    if (/^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\.[0-9]+$/.test(value)) {
      return 'SASB';
    }
    
    // GRI pattern: number-number format
    if (/^[0-9]{3}-[0-9]+$/.test(value)) {
      return 'GRI';
    }
    
    return null;
  }

  // 私有验证方法

  private validateCode(value: string, framework: Framework): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('MetricCode value cannot be empty');
    }

    const trimmedValue = value.trim();
    
    if (trimmedValue.length > 50) {
      throw new ValidationError('MetricCode value must be 50 characters or less');
    }

    // 基本格式验证：只允许字母、数字、连字符、点和下划线
    if (!/^[A-Za-z0-9\-._]+$/.test(trimmedValue)) {
      throw new ValidationError('MetricCode contains invalid characters. Only letters, numbers, hyphens, dots and underscores are allowed');
    }

    // 框架特定格式验证
    if (!this.validateFrameworkFormat(trimmedValue, framework)) {
      throw new ValidationError(`MetricCode "${trimmedValue}" is not valid for framework ${framework}`);
    }
  }

  private validateFrameworkFormat(value: string, framework: Framework): boolean {
    switch (framework) {
      case 'SASB':
        // SASB format: RT-AE-130a.1, FB-FR-270a.2, etc.
        // Pattern: [2-3 letters]-[2-3 letters]-[3 digits][optional letter].[1+ digits]
        return /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{3}[a-z]?\.[0-9]+$/.test(value);
      
      case 'GRI':
        // GRI format: 305-1, 401-1, etc.
        // Pattern: [3 digits]-[1+ digits]
        return /^[0-9]{3}-[0-9]+$/.test(value);
      
      case 'TCFD':
        // TCFD允许更灵活的格式，通常是描述性的
        return value.length >= 2 && value.length <= 50;
      
      case 'EU_TAXONOMY':
        // EU Taxonomy允许字母数字组合
        return value.length >= 2 && value.length <= 50;
      
      case 'CSRD':
        // CSRD允许字母数字组合
        return value.length >= 2 && value.length <= 50;
      
      default:
        return false;
    }
  }
}
