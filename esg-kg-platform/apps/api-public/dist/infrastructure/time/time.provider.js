export class SystemTimeProvider {
    defaultTimezone;
    defaultFormat;
    constructor(config = {}) {
        this.defaultTimezone = config.timezone || 'UTC';
        this.defaultFormat = config.defaultFormat || 'ISO';
    }
    now() {
        return new Date();
    }
    nowIso() {
        return this.now().toISOString();
    }
    nowUnix() {
        return Math.floor(this.now().getTime() / 1000);
    }
    formatDate(date, format) {
        const fmt = format || this.defaultFormat;
        switch (fmt.toUpperCase()) {
            case 'ISO':
                return date.toISOString();
            case 'DATE':
                return date.toISOString().split('T')[0];
            case 'TIME':
                return date.toISOString().split('T')[1].split('.')[0];
            case 'DATETIME':
                return date.toISOString().replace('T', ' ').split('.')[0];
            case 'UNIX':
                return Math.floor(date.getTime() / 1000).toString();
            case 'MILLIS':
                return date.getTime().toString();
            default:
                return this.customFormat(date, fmt);
        }
    }
    parseDate(dateString) {
        const parsed = new Date(dateString);
        if (isNaN(parsed.getTime())) {
            throw new Error(`Invalid date string: ${dateString}`);
        }
        return parsed;
    }
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }
    startOfDay(date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    endOfDay(date) {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    startOfMonth(date) {
        const result = new Date(date);
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    endOfMonth(date) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + 1, 0);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    startOfYear(date) {
        const result = new Date(date);
        result.setMonth(0, 1);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    endOfYear(date) {
        const result = new Date(date);
        result.setMonth(11, 31);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }
    toUtc(date) {
        return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    }
    fromUtc(date, timezone) {
        const tz = timezone || this.defaultTimezone;
        if (tz === 'UTC') {
            return new Date(date);
        }
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    }
    customFormat(date, format) {
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
export class MockTimeProvider {
    currentTime;
    systemProvider;
    constructor(fixedTime, config = {}) {
        this.currentTime = fixedTime || new Date();
        this.systemProvider = new SystemTimeProvider(config);
    }
    setTime(time) {
        this.currentTime = new Date(time);
    }
    advanceBy(milliseconds) {
        this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
    }
    advanceByDays(days) {
        this.advanceBy(days * 24 * 60 * 60 * 1000);
    }
    useSystemTime() {
        this.currentTime = new Date();
    }
    now() {
        return new Date(this.currentTime);
    }
    nowIso() {
        return this.currentTime.toISOString();
    }
    nowUnix() {
        return Math.floor(this.currentTime.getTime() / 1000);
    }
    formatDate(date, format) {
        return this.systemProvider.formatDate(date, format);
    }
    parseDate(dateString) {
        return this.systemProvider.parseDate(dateString);
    }
    addDays(date, days) {
        return this.systemProvider.addDays(date, days);
    }
    addMonths(date, months) {
        return this.systemProvider.addMonths(date, months);
    }
    startOfDay(date) {
        return this.systemProvider.startOfDay(date);
    }
    endOfDay(date) {
        return this.systemProvider.endOfDay(date);
    }
    startOfMonth(date) {
        return this.systemProvider.startOfMonth(date);
    }
    endOfMonth(date) {
        return this.systemProvider.endOfMonth(date);
    }
    startOfYear(date) {
        return this.systemProvider.startOfYear(date);
    }
    endOfYear(date) {
        return this.systemProvider.endOfYear(date);
    }
    isValidDate(date) {
        return this.systemProvider.isValidDate(date);
    }
    toUtc(date) {
        return this.systemProvider.toUtc(date);
    }
    fromUtc(date, timezone) {
        return this.systemProvider.fromUtc(date, timezone);
    }
}
export const timeProvider = new SystemTimeProvider();
export function createMockTimeProvider(fixedTime) {
    return new MockTimeProvider(fixedTime);
}
//# sourceMappingURL=time.provider.js.map