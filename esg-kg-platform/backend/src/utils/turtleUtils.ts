/**
 * Turtle 和 Triple 相关工具函数
 */
import { Triple, TripleResult } from '../types';
import { PREFIXES } from '../config';

/**
 * IRI 处理函数
 */
export const iri = (maybe: string): string => {
  if (maybe.startsWith('http://') || maybe.startsWith('https://')) {
    return `<${maybe}>`;
  }
  if (maybe.includes(':') && !maybe.startsWith('esg:') && !maybe.startsWith('rdfs:') && !maybe.startsWith('xsd:')) {
    // 如果包含冒号但不是已知前缀，当作完整URI处理
    return `<${maybe}>`;
  }
  return maybe.includes(':') ? maybe : `esg:${maybe}`;
};

/**
 * 字面量处理函数
 */
export const lit = (value: string | number | boolean, dt?: 'string' | 'int' | 'float' | 'boolean'): string => {
  if (typeof value === 'number') return `${value}`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (!dt || dt === 'string') return JSON.stringify(value);
  if (dt === 'int') return `${value}^^xsd:integer`;
  if (dt === 'float') return `${value}^^xsd:decimal`;
  if (dt === 'boolean') return value ? 'true' : 'false';
  return JSON.stringify(value);
};

/**
 * 将 Triple 数组转换为 TTL 字符串
 */
export const triplesToTTL = (triples: Triple[]): string => {
  const lines = triples.map(t => {
    // 确保所有IRI都正确格式化
    const subject = t.s.startsWith('http') && !t.s.startsWith('<') ? `<${t.s}>` : t.s;
    const predicate = t.p.startsWith('http') && !t.p.startsWith('<') ? `<${t.p}>` : t.p;
    const object = t.oType === 'iri' 
      ? (t.o.startsWith('http') && !t.o.startsWith('<') ? `<${t.o}>` : t.o)
      : t.o;
    return `${subject} ${predicate} ${object} .`;
  });
  return `${PREFIXES}\n\n${lines.join('\n')}\n`;
};

/**
 * 生成随机 UUID
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};