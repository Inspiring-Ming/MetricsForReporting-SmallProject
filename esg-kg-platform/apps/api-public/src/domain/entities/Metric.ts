/**
 * Metric Entity - ESG指标的核心业务实体
 * 
 * 职责：
 * - 封装ESG指标的业务逻辑和不变式
 * - 提供类型安全的属性访问
 * - 确保数据完整性和业务规则
 * - 支持领域事件和状态管理
 */

import { MetricCode, Framework } from '../value-objects/MetricCode';
import { UnitIri } from '../value-objects/UnitIri';
import { MetricValidationError } from '../errors/domain-errors';
import { ESGIriStrategy } from '../../infrastructure/id/iri';

export interface MetricProps {
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  value: number;
  unitIri: string;
  asOf: Date;
  source: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MetricIdentity {
  framework: Framework;
  industry: string;
  code: string;
  entityId: string;
  asOf: Date;
}

/**
 * ESG Metric Entity
 * 
 * 表示一个ESG指标的完整信息，包含其业务规则和验证逻辑
 */
export class Metric {
  private readonly _id: string;
  private readonly _framework: Framework;
  private readonly _industry: string;
  private readonly _code: MetricCode;
  private readonly _entityId: string;
  private readonly _value: number;
  private readonly _unitIri: UnitIri;
  private readonly _asOf: Date;
  private readonly _source: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: MetricProps) {
    this.validateProps(props);
    
    this._id = props.id || this.generateId(props);
    this._framework = props.framework;
    this._industry = props.industry.trim();
    this._code = new MetricCode(props.code, props.framework);
    this._entityId = props.entityId.trim();
    this._value = props.value;
    this._unitIri = new UnitIri(props.unitIri);
    this._asOf = new Date(props.asOf);
    this._source = props.source.trim();
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string { return this._id; }
  get framework(): Framework { return this._framework; }
  get industry(): string { return this._industry; }
  get code(): MetricCode { return this._code; }
  get entityId(): string { return this._entityId; }
  get value(): number { return this._value; }
  get unitIri(): UnitIri { return this._unitIri; }
  get asOf(): Date { return new Date(this._asOf); }
  get source(): string { return this._source; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }

  /**
   * 获取指标的唯一身份标识
   * 用于重复性检查和聚合操作
   */
  getIdentity(): MetricIdentity {
    return {
      framework: this._framework,
      industry: this._industry,
      code: this._code.value,
      entityId: this._entityId,
      asOf: this.asOf
    };
  }

  /**
   * 生成指标的IRI (Internationalized Resource Identifier)
   * 
   * 委托给ESGIriStrategy以确保IRI生成的一致性和标准化
   * 
   * @returns 符合语义网规范的指标IRI
   */
  generateIri(): string {
    const asOfStr = this._asOf.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!asOfStr) {
      throw new MetricValidationError('Failed to format asOf date', {
        errors: [`Invalid date: ${this._asOf}`]
      });
    }
    
    return ESGIriStrategy.generateMetricIri(
      this._framework,
      this._industry,
      this._code.value,
      this._entityId,
      asOfStr
    );
  }

  /**
   * 检查是否为同一指标（相同身份标识）
   */
  isSameMetric(other: Metric): boolean {
    const thisIdentity = this.getIdentity();
    const otherIdentity = other.getIdentity();
    
    return (
      thisIdentity.framework === otherIdentity.framework &&
      thisIdentity.industry === otherIdentity.industry &&
      thisIdentity.code === otherIdentity.code &&
      thisIdentity.entityId === otherIdentity.entityId &&
      thisIdentity.asOf.getTime() === otherIdentity.asOf.getTime()
    );
  }

  /**
   * 检查指标是否为直接测量值（非计算值）
   * 基于source字段的启发式判断
   */
  isDirectMeasurement(): boolean {
    const source = this._source.toLowerCase();
    const directIndicators = [
      'annual report', 'sustainability report', 'financial filing',
      'regulatory filing', 'company disclosure', 'direct measurement',
      'sensor data', 'meter reading'
    ];
    
    return directIndicators.some(indicator => source.includes(indicator));
  }

  /**
   * 检查指标是否为计算值
   */
  isComputedValue(): boolean {
    return !this.isDirectMeasurement();
  }

  /**
   * 获取指标的报告期间类型
   */
  getReportingPeriodType(): 'annual' | 'quarterly' | 'monthly' | 'daily' | 'point-in-time' {
    const source = this._source.toLowerCase();
    
    if (source.includes('annual')) return 'annual';
    if (source.includes('quarterly') || source.includes('q1') || source.includes('q2') || 
        source.includes('q3') || source.includes('q4')) return 'quarterly';
    if (source.includes('monthly')) return 'monthly';
    if (source.includes('daily')) return 'daily';
    
    return 'point-in-time';
  }

  /**
   * 转换为DTO格式
   */
  toDto() {
    return {
      id: this._id,
      framework: this._framework,
      industry: this._industry,
      code: this._code.value,
      entityId: this._entityId,
      value: this._value,
      unitIri: this._unitIri.value,
      asOf: this._asOf.toISOString(),
      source: this._source,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }

  /**
   * 转换为RDF三元组（TTL格式）
   */
  toRdfTriples(metricIri?: string): string {
    const iri = metricIri || this.generateIri();
    const asOfDate = this._asOf.toISOString().split('T')[0];
    
    return `
@prefix esg: <http://example.org/esg#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix qudt: <http://qudt.org/schema/qudt/> .

<${iri}> a esg:Metric ;
    esg:framework "${this._framework}" ;
    esg:industry "${this._industry}" ;
    esg:code "${this._code.value}" ;
    esg:entityId "${this._entityId}" ;
    esg:value "${this._value}"^^xsd:decimal ;
    esg:unitIri <${this._unitIri.value}> ;
    esg:asOf "${asOfDate}"^^xsd:date ;
    esg:source "${this._source}" ;
    esg:createdAt "${this._createdAt.toISOString()}"^^xsd:dateTime ;
    esg:updatedAt "${this._updatedAt.toISOString()}"^^xsd:dateTime .
`.trim();
  }

  /**
   * 更新时间戳
   */
  touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * 创建指标副本
   */
  clone(): Metric {
    return new Metric({
      id: this._id,
      framework: this._framework,
      industry: this._industry,
      code: this._code.value,
      entityId: this._entityId,
      value: this._value,
      unitIri: this._unitIri.value,
      asOf: this._asOf,
      source: this._source,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    });
  }

  // 静态工厂方法

  /**
   * 从DTO创建Metric实体
   */
  static fromDto(dto: any): Metric {
    const props: MetricProps = {
      id: dto.id,
      framework: dto.framework,
      industry: dto.industry,
      code: dto.code,
      entityId: dto.entityId,
      value: dto.value,
      unitIri: dto.unitIri,
      asOf: new Date(dto.asOf),
      source: dto.source
    };
    
    if (dto.createdAt) {
      props.createdAt = new Date(dto.createdAt);
    }
    
    if (dto.updatedAt) {
      props.updatedAt = new Date(dto.updatedAt);
    }
    
    return new Metric(props);
  }

  /**
   * 创建指标身份标识的哈希值
   */
  static createIdentityHash(identity: MetricIdentity): string {
    const identityString = `${identity.framework}|${identity.industry}|${identity.code}|${identity.entityId}|${identity.asOf.toISOString()}`;
    
    // Simple hash function (in production, use crypto hash)
    let hash = 0;
    for (let i = 0; i < identityString.length; i++) {
      const char = identityString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // 私有方法

  private validateProps(props: MetricProps): void {
    const errors: string[] = [];

    // Framework validation
    if (!props.framework) {
      errors.push('framework is required');
    }

    // Industry validation
    if (!props.industry || props.industry.trim().length === 0) {
      errors.push('industry is required');
    } else if (props.industry.length > 100) {
      errors.push('industry must be 100 characters or less');
    }

    // EntityId validation
    if (!props.entityId || props.entityId.trim().length === 0) {
      errors.push('entityId is required');
    } else if (props.entityId.length > 100) {
      errors.push('entityId must be 100 characters or less');
    }

    // Value validation
    if (typeof props.value !== 'number') {
      errors.push('value must be a number');
    } else if (!isFinite(props.value)) {
      errors.push('value must be finite');
    }

    // AsOf validation
    if (!props.asOf) {
      errors.push('asOf is required');
    } else {
      const asOfDate = new Date(props.asOf);
      if (isNaN(asOfDate.getTime())) {
        errors.push('asOf must be a valid date');
      } else if (asOfDate > new Date()) {
        errors.push('asOf cannot be in the future');
      }
    }

    // Source validation
    if (!props.source || props.source.trim().length === 0) {
      errors.push('source is required');
    } else if (props.source.length > 500) {
      errors.push('source must be 500 characters or less');
    }

    if (errors.length > 0) {
      throw new MetricValidationError('Invalid metric properties', { errors });
    }
  }

  private generateId(props: MetricProps): string {
    const identity: MetricIdentity = {
      framework: props.framework,
      industry: props.industry,
      code: props.code,
      entityId: props.entityId,
      asOf: new Date(props.asOf)
    };
    
    return Metric.createIdentityHash(identity);
  }
}
