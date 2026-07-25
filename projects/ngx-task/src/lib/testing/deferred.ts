export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
  readonly isSettled: boolean;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  let isSettled = false;

  const promise = new Promise<T>((res, rej) => {
    resolve = (val) => {
      isSettled = true;
      res(val);
    };
    reject = (reason) => {
      isSettled = true;
      rej(reason);
    };
  });

  return {
    promise,
    resolve,
    reject,
    get isSettled() {
      return isSettled;
    },
  };
}
