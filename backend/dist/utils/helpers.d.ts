export declare function customAlphabet(_alphabet: string, size?: number): () => string;
export declare function decimal(value: number | string): string;
export declare function addDecimal(a: number, b: number): number;
export declare function subtractDecimal(a: number, b: number): number;
export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare function assert(condition: boolean, message: string, code?: string): asserts condition;
//# sourceMappingURL=helpers.d.ts.map