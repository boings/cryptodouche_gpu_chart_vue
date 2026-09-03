export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export declare function canonicalSerialize(value: unknown): string;
export declare function canonicalHash(value: unknown): string;
export declare function immutableJsonClone<T>(value: T): T;
