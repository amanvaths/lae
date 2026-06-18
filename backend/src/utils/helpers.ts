export function customAlphabet(
  _alphabet: string,
  size = 21
): () => string {
  return () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < size; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };
}

export function decimal(value: number | string): string {
  return String(value);
}

export function addDecimal(a: number, b: number): number {
  return Math.round((a + b) * 1e18) / 1e18;
}

export function subtractDecimal(a: number, b: number): number {
  return Math.round((a - b) * 1e18) / 1e18;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function assert(condition: boolean, message: string, code?: string): asserts condition {
  if (!condition) {
    throw new AppError(400, message, code);
  }
}
