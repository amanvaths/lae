export function customAlphabet(_alphabet, size = 21) {
    return () => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let id = "";
        for (let i = 0; i < size; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    };
}
export function decimal(value) {
    return String(value);
}
export function addDecimal(a, b) {
    return Math.round((a + b) * 1e18) / 1e18;
}
export function subtractDecimal(a, b) {
    return Math.round((a - b) * 1e18) / 1e18;
}
export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
    }
}
export function assert(condition, message, code) {
    if (!condition) {
        throw new AppError(400, message, code);
    }
}
//# sourceMappingURL=helpers.js.map