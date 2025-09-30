/**
 * Value Entity - ESG指标的数值表示
 * 
 * 职责：
 * - 封装数值和单位的组合
 * - 提供数值运算和转换能力
 * - 确保数值的精度和有效性
 * - 支持不同单位之间的比较和转换
 */

import { UnitIri, UnitType } from '../value-objects/UnitIri';
import { ValidationError } from '../errors/domain-errors';

export interface ValueProps {
  amount: number;
  unitIri: string;
  precision?: number;
  isEstimated?: boolean;
  confidence?: number; // 0-1, 置信度
  source?: string;
}

/**
 * Value 实体
 * 
 * 表示带有单位的数值，支持ESG指标中的各种数值类型
 */
export class Value {
  private readonly _amount: number;
  private readonly _unitIri: UnitIri;
  private readonly _precision: number;
  private readonly _isEstimated: boolean;
  private readonly _confidence: number;
  private readonly _source?: string;

  constructor(props: ValueProps) {
    this.validateProps(props);
    
    this._amount = props.amount;
    this._unitIri = new UnitIri(props.unitIri);
    this._precision = props.precision ?? this.calculateDefaultPrecision(props.amount);
    this._isEstimated = props.isEstimated ?? false;
    this._confidence = props.confidence ?? 1.0;
    
    if (props.source) {
      this._source = props.source;
    }
  }

  // Getters
  get amount(): number { return this._amount; }
  get unitIri(): UnitIri { return this._unitIri; }
  get precision(): number { return this._precision; }
  get isEstimated(): boolean { return this._isEstimated; }
  get confidence(): number { return this._confidence; }
  get source(): string | undefined { return this._source; }

  /**
   * 获取格式化的数值字符串
   */
  getFormattedAmount(): string {
    return this._amount.toFixed(this._precision);
  }

  /**
   * 获取带单位的显示字符串
   */
  getDisplayString(): string {
    const formattedAmount = this.getFormattedAmount();
    const unitDisplay = this._unitIri.getDisplayName();
    
    if (!unitDisplay) {
      return formattedAmount;
    }
    
    return `${formattedAmount} ${unitDisplay}`;
  }

  /**
   * 检查是否为零值
   */
  isZero(): boolean {
    return Math.abs(this._amount) < Math.pow(10, -this._precision);
  }

  /**
   * 检查是否为正值
   */
  isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * 检查是否为负值
   */
  isNegative(): boolean {
    return this._amount < 0;
  }

  /**
   * 检查数值是否在合理范围内
   */
  isReasonable(): boolean {
    // 检查是否为有限数值
    if (!isFinite(this._amount)) {
      return false;
    }
    
    // 检查是否为过大或过小的数值
    if (Math.abs(this._amount) > 1e15 || (this._amount !== 0 && Math.abs(this._amount) < 1e-15)) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查单位类型
   */
  getUnitType(): UnitType {
    return this._unitIri.unitType;
  }

  /**
   * 检查是否可以与另一个Value进行数值比较
   */
  isComparableWith(other: Value): boolean {
    return this._unitIri.isCompatibleWith(other._unitIri);
  }

  /**
   * 比较两个Value的大小
   * 返回: -1 (小于), 0 (等于), 1 (大于)
   */
  compareTo(other: Value): number {
    if (!this.isComparableWith(other)) {
      throw new ValidationError(`Cannot compare values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
    }
    
    if (this._amount < other._amount) return -1;
    if (this._amount > other._amount) return 1;
    return 0;
  }

  /**
   * 检查是否等于另一个Value
   */
  equals(other: Value): boolean {
    if (!this.isComparableWith(other)) {
      return false;
    }
    
    const epsilon = Math.pow(10, -Math.min(this._precision, other._precision));
    return Math.abs(this._amount - other._amount) < epsilon;
  }

  /**
   * 加法运算（仅限相同单位类型）
   */
  add(other: Value): Value {
    if (!this.isComparableWith(other)) {
      throw new ValidationError(`Cannot add values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
    }
    
    // 使用更低的精度作为结果精度
    const resultPrecision = Math.min(this._precision, other._precision);
    
    // 考虑置信度的影响
    const resultConfidence = Math.min(this._confidence, other._confidence);
    
    return new Value({
      amount: this._amount + other._amount,
      unitIri: this._unitIri.value,
      precision: resultPrecision,
      isEstimated: this._isEstimated || other._isEstimated,
      confidence: resultConfidence,
      source: `${this._source || 'unknown'} + ${other._source || 'unknown'}`
    });
  }

  /**
   * 减法运算（仅限相同单位类型）
   */
  subtract(other: Value): Value {
    if (!this.isComparableWith(other)) {
      throw new ValidationError(`Cannot subtract values with different unit types: ${this._unitIri.unitType} vs ${other._unitIri.unitType}`);
    }
    
    const resultPrecision = Math.min(this._precision, other._precision);
    const resultConfidence = Math.min(this._confidence, other._confidence);
    
    return new Value({
      amount: this._amount - other._amount,
      unitIri: this._unitIri.value,
      precision: resultPrecision,
      isEstimated: this._isEstimated || other._isEstimated,
      confidence: resultConfidence,
      source: `${this._source || 'unknown'} - ${other._source || 'unknown'}`
    });
  }

  /**
   * 乘法运算（可以与无量纲数值相乘）
   */
  multiplyBy(multiplier: number): Value {
    if (!isFinite(multiplier)) {
      throw new ValidationError('Multiplier must be a finite number');
    }
    
    return new Value({
      amount: this._amount * multiplier,
      unitIri: this._unitIri.value,
      precision: this._precision,
      isEstimated: this._isEstimated,
      confidence: this._confidence,
      source: `${this._source || 'unknown'} * ${multiplier}`
    });
  }

  /**
   * 除法运算（可以与无量纲数值相除）
   */
  divideBy(divisor: number): Value {
    if (!isFinite(divisor) || divisor === 0) {
      throw new ValidationError('Divisor must be a finite non-zero number');
    }
    
    return new Value({
      amount: this._amount / divisor,
      unitIri: this._unitIri.value,
      precision: this._precision,
      isEstimated: this._isEstimated,
      confidence: this._confidence,
      source: `${this._source || 'unknown'} / ${divisor}`
    });
  }

  /**
   * 获取绝对值
   */
  abs(): Value {
    if (this._amount >= 0) {
      return this;
    }
    
    return new Value({
      amount: Math.abs(this._amount),
      unitIri: this._unitIri.value,
      precision: this._precision,
      isEstimated: this._isEstimated,
      confidence: this._confidence,
      source: `abs(${this._source || 'unknown'})`
    });
  }

  /**
   * 转换为DTO格式
   */
  toDto() {
    return {
      amount: this._amount,
      unitIri: this._unitIri.value,
      precision: this._precision,
      isEstimated: this._isEstimated,
      confidence: this._confidence,
      source: this._source,
      displayString: this.getDisplayString(),
      unitType: this._unitIri.unitType
    };
  }

  /**
   * 创建Value的副本
   */
  clone(): Value {
    const props: ValueProps = {
      amount: this._amount,
      unitIri: this._unitIri.value,
      precision: this._precision,
      isEstimated: this._isEstimated,
      confidence: this._confidence
    };
    
    if (this._source) {
      props.source = this._source;
    }
    
    return new Value(props);
  }

  // 静态工厂方法

  /**
   * 创建零值
   */
  static zero(unitIri: string): Value {
    return new Value({
      amount: 0,
      unitIri,
      precision: 2
    });
  }

  /**
   * 从简单数值创建Value
   */
  static fromNumber(amount: number, unitIri: string): Value {
    return new Value({
      amount,
      unitIri
    });
  }

  /**
   * 创建估算值
   */
  static createEstimate(amount: number, unitIri: string, confidence: number = 0.8): Value {
    return new Value({
      amount,
      unitIri,
      isEstimated: true,
      confidence,
      source: 'estimated'
    });
  }

  // 私有方法

  private validateProps(props: ValueProps): void {
    const errors: string[] = [];

    // 数量验证
    if (typeof props.amount !== 'number') {
      errors.push('amount must be a number');
    } else if (!isFinite(props.amount)) {
      errors.push('amount must be finite');
    }

    // 精度验证
    if (props.precision !== undefined) {
      if (typeof props.precision !== 'number' || props.precision < 0 || props.precision > 15) {
        errors.push('precision must be between 0 and 15');
      }
    }

    // 置信度验证
    if (props.confidence !== undefined) {
      if (typeof props.confidence !== 'number' || props.confidence < 0 || props.confidence > 1) {
        errors.push('confidence must be between 0 and 1');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`Invalid Value properties: ${errors.join(', ')}`);
    }
  }

  private calculateDefaultPrecision(amount: number): number {
    if (amount === 0) return 0;
    
    // 基于数值大小确定默认精度
    const magnitude = Math.abs(amount);
    
    if (magnitude >= 1000000) return 0; // 大数值，整数精度
    if (magnitude >= 1000) return 1;    // 千级别，1位小数
    if (magnitude >= 1) return 2;       // 个位级别，2位小数
    if (magnitude >= 0.01) return 3;    // 分级别，3位小数
    
    return 4; // 更小的数值，4位小数
  }
}
