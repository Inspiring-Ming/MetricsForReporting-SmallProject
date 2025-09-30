/**
 * Time Provider - System time abstraction
 * 
 * Responsibilities:
 * - Provide current system time
 * - Support testing with mock times
 * - Handle timezone conversions
 * - Format timestamps consistently
 */

export interface TimeConfig {
  timezone?: string;
  defaultFormat?: string;
}

export interface TimeProvider {
  now(): Date;
  nowIso(): string;
  nowUnix(): number;
  formatDate(date: Date, format?: string): string;
  parseDate(dateString: string): Date;
  addDays(date: Date, days: number): Date;
  addMonths(date: Date, months: number): Date;
  startOfDay(date: Date): Date;
  endOfDay(date: Date): Date;
  startOfMonth(date: Date): Date;
  endOfMonth(date: Date): Date;
  startOfYear(date: Date): Date;
  endOfYear(date: Date): Date;
  isValidDate(date: any): boolean;
  toUtc(date: Date): Date;
  fromUtc(date: Date, timezone?: string): Date;
}

/**
 * System Time Provider - Uses actual system time
 */
export class SystemTimeProvider implements TimeProvider {
  private readonly defaultTimezone: string;
  private readonly defaultFormat: string;

  constructor(config: TimeConfig = {}) {
    this.defaultTimezone = config.timezone || 'UTC';
    this.defaultFormat = config.defaultFormat || 'ISO';
  }

  /**
   * Get current date and time
   */
  now(): Date {
    return new Date();
  }

  /**
   * Get current time as ISO string
   */
  nowIso(): string {
    return this.now().toISOString();
  }

  /**
   * Get current time as Unix timestamp
   */
  nowUnix(): number {
    return Math.floor(this.now().getTime() / 1000);
  }

  /**
   * Format date according to specified format
   */
  formatDate(date: Date, format?: string): string {
    const fmt = format || this.defaultFormat;
    
    switch (fmt.toUpperCase()) {
      case 'ISO':
        return date.toISOString();
      case 'DATE':
        return date.toISOString().split('T')[0]!;
      case 'TIME':
        return date.toISOString().split('T')[1]!.split('.')[0]!;
      case 'DATETIME':
        return date.toISOString().replace('T', ' ').split('.')[0]!
      case 'UNIX':
        return Math.floor(date.getTime() / 1000).toString();
      case 'MILLIS':
        return date.getTime().toString();
      default:
        return this.customFormat(date, fmt);
    }
  }

  /**
   * Parse date string into Date object
   */
  parseDate(dateString: string): Date {
    const parsed = new Date(dateString);
    
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    
    return parsed;
  }

  /**
   * Add days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add months to a date
   */
  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Get start of day (00:00:00.000)
   */
  startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day (23:59:59.999)
   */
  endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of month (first day, 00:00:00.000)
   */
  startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of month (last day, 23:59:59.999)
   */
  endOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0); // Set to last day of current month
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of year (Jan 1, 00:00:00.000)
   */
  startOfYear(date: Date): Date {
    const result = new Date(date);
    result.setMonth(0, 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of year (Dec 31, 23:59:59.999)
   */
  endOfYear(date: Date): Date {
    const result = new Date(date);
    result.setMonth(11, 31);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Check if value is a valid date
   */
  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Convert date to UTC
   */
  toUtc(date: Date): Date {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  }

  /**
   * Convert UTC date to specified timezone
   */
  fromUtc(date: Date, timezone?: string): Date {
    const tz = timezone || this.defaultTimezone;
    
    if (tz === 'UTC') {
      return new Date(date);
    }
    
    // Simple timezone conversion (in production, use a proper timezone library)
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  }

  /**
   * Custom format implementation
   */
  private customFormat(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}

/**
 * Mock Time Provider - For testing with fixed times
 */
export class MockTimeProvider implements TimeProvider {
  private currentTime: Date;
  private readonly systemProvider: SystemTimeProvider;

  constructor(fixedTime?: Date, config: TimeConfig = {}) {
    this.currentTime = fixedTime || new Date();
    this.systemProvider = new SystemTimeProvider(config);
  }

  /**
   * Set the mock time
   */
  setTime(time: Date): void {
    this.currentTime = new Date(time);
  }

  /**
   * Advance time by milliseconds
   */
  advanceBy(milliseconds: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
  }

  /**
   * Advance time by days
   */
  advanceByDays(days: number): void {
    this.advanceBy(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Reset to system time
   */
  useSystemTime(): void {
    this.currentTime = new Date();
  }

  // Implement TimeProvider interface using mock time

  now(): Date {
    return new Date(this.currentTime);
  }

  nowIso(): string {
    return this.currentTime.toISOString();
  }

  nowUnix(): number {
    return Math.floor(this.currentTime.getTime() / 1000);
  }

  formatDate(date: Date, format?: string): string {
    return this.systemProvider.formatDate(date, format);
  }

  parseDate(dateString: string): Date {
    return this.systemProvider.parseDate(dateString);
  }

  addDays(date: Date, days: number): Date {
    return this.systemProvider.addDays(date, days);
  }

  addMonths(date: Date, months: number): Date {
    return this.systemProvider.addMonths(date, months);
  }

  startOfDay(date: Date): Date {
    return this.systemProvider.startOfDay(date);
  }

  endOfDay(date: Date): Date {
    return this.systemProvider.endOfDay(date);
  }

  startOfMonth(date: Date): Date {
    return this.systemProvider.startOfMonth(date);
  }

  endOfMonth(date: Date): Date {
    return this.systemProvider.endOfMonth(date);
  }

  startOfYear(date: Date): Date {
    return this.systemProvider.startOfYear(date);
  }

  endOfYear(date: Date): Date {
    return this.systemProvider.endOfYear(date);
  }

  isValidDate(date: any): boolean {
    return this.systemProvider.isValidDate(date);
  }

  toUtc(date: Date): Date {
    return this.systemProvider.toUtc(date);
  }

  fromUtc(date: Date, timezone?: string): Date {
    return this.systemProvider.fromUtc(date, timezone);
  }
}

/**
 * Default time provider instance
 */
export const timeProvider: TimeProvider = new SystemTimeProvider();

/**
 * Create a mock time provider for testing
 */
export function createMockTimeProvider(fixedTime?: Date): MockTimeProvider {
  return new MockTimeProvider(fixedTime);
}