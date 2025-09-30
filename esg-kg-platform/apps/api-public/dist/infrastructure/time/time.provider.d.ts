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
export declare class SystemTimeProvider implements TimeProvider {
    private readonly defaultTimezone;
    private readonly defaultFormat;
    constructor(config?: TimeConfig);
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
    private customFormat;
}
export declare class MockTimeProvider implements TimeProvider {
    private currentTime;
    private readonly systemProvider;
    constructor(fixedTime?: Date, config?: TimeConfig);
    setTime(time: Date): void;
    advanceBy(milliseconds: number): void;
    advanceByDays(days: number): void;
    useSystemTime(): void;
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
export declare const timeProvider: TimeProvider;
export declare function createMockTimeProvider(fixedTime?: Date): MockTimeProvider;
//# sourceMappingURL=time.provider.d.ts.map