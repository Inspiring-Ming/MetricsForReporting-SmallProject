/**
 * UnitIri Value Object - 单位IRI封装
 * 
 * 职责：
 * - 验证单位IRI的格式正确性
 * - 支持QUDT单位本体的IRI格式
 * - 提供单位类型的识别和分类
 * - 确保单位IRI的语义正确性
 */

import { ValidationError } from '../errors/domain-errors';

export type UnitType = 
  | 'mass' 
  | 'energy' 
  | 'volume' 
  | 'count' 
  | 'currency' 
  | 'time' 
  | 'percentage' 
  | 'ratio'
  | 'area'
  | 'emission'
  | 'rate'
  | 'other';

/**
 * 单位IRI值对象
 * 
 * 封装QUDT (Quantities, Units, Dimensions and Types) 单位本体的IRI
 * 例如：http://qudt.org/vocab/unit/KiloGM, http://qudt.org/vocab/unit/M3
 */
export class UnitIri {
  private readonly _value: string;
  private readonly _unitType: UnitType;

  constructor(value: string) {
    this.validateIri(value);
    this._value = value.trim();
    this._unitType = this.detectUnitType(this._value);
  }

  get value(): string {
    return this._value;
  }

  get unitType(): UnitType {
    return this._unitType;
  }

  /**
   * 检查是否为QUDT单位IRI
   */
  isQudtUnit(): boolean {
    return this._value.startsWith('http://qudt.org/vocab/unit/');
  }

  /**
   * 获取QUDT单位代码
   * 例如：http://qudt.org/vocab/unit/KiloGM -> KiloGM
   */
  getQudtUnitCode(): string | null {
    if (!this.isQudtUnit()) {
      return null;
    }
    
    const parts = this._value.split('/');
    return parts[parts.length - 1] || null;
  }

  /**
   * 检查是否为质量单位
   */
  isMassUnit(): boolean {
    return this._unitType === 'mass';
  }

  /**
   * 检查是否为能源单位
   */
  isEnergyUnit(): boolean {
    return this._unitType === 'energy';
  }

  /**
   * 检查是否为排放单位
   */
  isEmissionUnit(): boolean {
    return this._unitType === 'emission';
  }

  /**
   * 检查是否为货币单位
   */
  isCurrencyUnit(): boolean {
    return this._unitType === 'currency';
  }

  /**
   * 检查是否为百分比单位
   */
  isPercentageUnit(): boolean {
    return this._unitType === 'percentage';
  }

  /**
   * 检查是否为计数单位
   */
  isCountUnit(): boolean {
    return this._unitType === 'count';
  }

  /**
   * 获取单位的显示名称
   */
  getDisplayName(): string {
    const unitCode = this.getQudtUnitCode();
    if (!unitCode) {
      return this._value;
    }

    // 常见单位的显示名称映射
    const displayNames: Record<string, string> = {
      'KiloGM': 'kg',
      'Tonne': 't',
      'GM': 'g',
      'M3': 'm³',
      'L': 'L',
      'KiloW-HR': 'kWh',
      'MegaW-HR': 'MWh',
      'J': 'J',
      'KiloJ': 'kJ',
      'MegaJ': 'MJ',
      'NUM': 'count',
      'UNITLESS': '',
      'PERCENT': '%',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'YR': 'year',
      'MO': 'month',
      'DAY': 'day',
      'HR': 'hour'
    };

    return displayNames[unitCode] || unitCode;
  }

  /**
   * 检查是否与另一个单位兼容（可以进行数值比较）
   */
  isCompatibleWith(other: UnitIri): boolean {
    return this._unitType === other._unitType;
  }

  /**
   * 检查是否为同一单位
   */
  equals(other: UnitIri): boolean {
    return this._value === other._value;
  }

  /**
   * 转换为字符串表示
   */
  toString(): string {
    return this._value;
  }

  // 静态工厂方法

  /**
   * 从QUDT单位代码创建UnitIri
   */
  static fromQudtCode(unitCode: string): UnitIri {
    return new UnitIri(`http://qudt.org/vocab/unit/${unitCode}`);
  }

  /**
   * 常用单位的静态创建方法
   */
  static kilogram(): UnitIri {
    return UnitIri.fromQudtCode('KiloGM');
  }

  static tonne(): UnitIri {
    return UnitIri.fromQudtCode('Tonne');
  }

  static cubicMeter(): UnitIri {
    return UnitIri.fromQudtCode('M3');
  }

  static kilowattHour(): UnitIri {
    return UnitIri.fromQudtCode('KiloW-HR');
  }

  static count(): UnitIri {
    return UnitIri.fromQudtCode('NUM');
  }

  static percentage(): UnitIri {
    return UnitIri.fromQudtCode('PERCENT');
  }

  static usd(): UnitIri {
    return UnitIri.fromQudtCode('USD');
  }

  // 私有方法

  private validateIri(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('UnitIri value cannot be empty');
    }

    const trimmedValue = value.trim();

    // 检查是否为有效的HTTP(S) IRI
    if (!/^https?:\/\/.+/.test(trimmedValue)) {
      throw new ValidationError('UnitIri must be a valid HTTP or HTTPS IRI');
    }

    // 检查IRI长度
    if (trimmedValue.length > 200) {
      throw new ValidationError('UnitIri must be 200 characters or less');
    }

    // 检查是否包含无效字符
    try {
      new URL(trimmedValue);
    } catch {
      throw new ValidationError('UnitIri contains invalid URL characters');
    }
  }

  private detectUnitType(_iri: string): UnitType {
    const unitCode = this.getQudtUnitCode();
    if (!unitCode) {
      return 'other';
    }

    // 质量单位
    const massUnits = ['GM', 'KiloGM', 'Tonne', 'LB', 'OZ'];
    if (massUnits.includes(unitCode)) {
      return 'mass';
    }

    // 排放单位 (通常是质量的二氧化碳当量)
    if (unitCode.includes('CO2') || unitCode.includes('tCO2e') || unitCode.includes('kgCO2e')) {
      return 'emission';
    }

    // 能源单位
    const energyUnits = ['J', 'KiloJ', 'MegaJ', 'W-HR', 'KiloW-HR', 'MegaW-HR', 'BTU'];
    if (energyUnits.includes(unitCode)) {
      return 'energy';
    }

    // 体积单位
    const volumeUnits = ['L', 'MilliL', 'M3', 'FT3', 'GAL'];
    if (volumeUnits.includes(unitCode)) {
      return 'volume';
    }

    // 面积单位
    const areaUnits = ['M2', 'FT2', 'HECTARE', 'ACRE'];
    if (areaUnits.includes(unitCode)) {
      return 'area';
    }

    // 货币单位
    const currencyUnits = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];
    if (currencyUnits.includes(unitCode)) {
      return 'currency';
    }

    // 时间单位
    const timeUnits = ['SEC', 'MIN', 'HR', 'DAY', 'WK', 'MO', 'YR'];
    if (timeUnits.includes(unitCode)) {
      return 'time';
    }

    // 百分比和比率
    if (unitCode === 'PERCENT' || unitCode === 'FRACTION') {
      return 'percentage';
    }

    // 计数单位
    if (unitCode === 'NUM' || unitCode === 'UNITLESS') {
      return 'count';
    }

    // 速率单位 (通常包含 -PER-)
    if (unitCode.includes('-PER-')) {
      return 'rate';
    }

    return 'other';
  }
}
