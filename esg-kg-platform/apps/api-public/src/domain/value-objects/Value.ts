/**
 * Value Value Object - 轻量级的数值表示
 * 
 * 职责：
 * - 提供简单的数值和单位封装
 * - 用于DTO和API传输
 * - 基本的数值验证和格式化
 */

import { ValidationError } from '../errors/domain-errors';

export interface ValueData {
  amount: number;
  unitIri: string;
}

/**
 * 简单的Value值对象
 * 
 * 相比于entities/Value.ts中的完整实体，这个值对象更轻量级
 * 主要用于数据传输和简单的数值表示
 */
export class SimpleValue {
  private readonly _amount: number;
  private readonly _unitIri: string;

  constructor(amount: number, unitIri: string) {
    this.validate(amount, unitIri);
    this._amount = amount;
    this._unitIri = unitIri;
  }

  get amount(): number {
    return this._amount;
  }

  get unitIri(): string {
    return this._unitIri;
  }

  /**
   * 转换为简单对象
   */
  toPlainObject(): ValueData {
    return {
      amount: this._amount,
      unitIri: this._unitIri
    };
  }

  /**
   * 检查是否等于另一个SimpleValue
   */
  equals(other: SimpleValue): boolean {
    return this._amount === other._amount && this._unitIri === other._unitIri;
  }

  /**
   * 转换为字符串表示
   */
  toString(): string {
    return `${this._amount} ${this._unitIri}`;
  }

  // 静态工厂方法

  /**
   * 从对象数据创建SimpleValue
   */
  static fromData(data: ValueData): SimpleValue {
    return new SimpleValue(data.amount, data.unitIri);
  }

  /**
   * 从JSON字符串创建SimpleValue
   */
  static fromJson(json: string): SimpleValue {
    try {
      const data = JSON.parse(json) as ValueData;
      return SimpleValue.fromData(data);
    } catch (error) {
      throw new ValidationError('Invalid JSON format for SimpleValue', undefined, error instanceof Error ? error : undefined);
    }
  }

  // 私有验证方法

  private validate(amount: number, unitIri: string): void {
    if (typeof amount !== 'number') {
      throw new ValidationError('Amount must be a number');
    }

    if (!isFinite(amount)) {
      throw new ValidationError('Amount must be finite');
    }

    if (!unitIri || typeof unitIri !== 'string') {
      throw new ValidationError('UnitIri must be a non-empty string');
    }

    if (!unitIri.startsWith('http://') && !unitIri.startsWith('https://')) {
      throw new ValidationError('UnitIri must be a valid HTTP or HTTPS IRI');
    }
  }
}
