export interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly resolve: (value: T | PromiseLike<T>) => void;
    readonly reject: (reason?: unknown) => void;
    readonly isSettled: boolean;
}
export declare function createDeferred<T>(): Deferred<T>;
//# sourceMappingURL=deferred.d.ts.map