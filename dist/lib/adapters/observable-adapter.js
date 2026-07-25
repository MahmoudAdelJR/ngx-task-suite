"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableOperationAdapter = void 0;
exports.isObservable = isObservable;
const promise_adapter_js_1 = require("./promise-adapter.js");
function isObservable(value) {
    return (value !== null &&
        (typeof value === 'object' || typeof value === 'function') &&
        typeof value.subscribe === 'function');
}
class ObservableOperationAdapter {
    handler;
    policy;
    classifyError;
    constructor(handler, options) {
        this.handler = handler;
        this.policy = options?.observableResult ?? 'latest';
        this.classifyError = options?.classifyError ?? promise_adapter_js_1.defaultClassifyError;
    }
    runWithObservable(execution, observable) {
        const context = execution.createContext();
        let subscription = null;
        let lastValue;
        let emissionCount = 0;
        const onAbort = () => {
            if (subscription && !subscription.closed) {
                subscription.unsubscribe();
            }
        };
        if (execution.signal.aborted) {
            execution.cancel(execution.signal.reason);
            return;
        }
        execution.signal.addEventListener('abort', onAbort, { once: true });
        try {
            subscription = observable.subscribe({
                next: (value) => {
                    if (execution.isSettled || execution.signal.aborted)
                        return;
                    emissionCount++;
                    if (this.policy === 'first') {
                        if (emissionCount === 1) {
                            lastValue = value;
                            execution.succeed(value);
                            subscription?.unsubscribe();
                        }
                        return;
                    }
                    if (this.policy === 'forbid-multiple' && emissionCount > 1) {
                        const err = {
                            cause: new Error(`Observable emitted multiple values when policy was forbid-multiple.`),
                            kind: 'application',
                            message: `Observable emitted multiple values when policy was forbid-multiple.`,
                            retryable: false,
                        };
                        execution.fail(err);
                        subscription?.unsubscribe();
                        return;
                    }
                    lastValue = value;
                    execution.reportProgress({ current: emissionCount, message: `Emitted ${emissionCount} values` });
                },
                error: (error) => {
                    execution.signal.removeEventListener('abort', onAbort);
                    if (execution.isSettled || execution.signal.aborted)
                        return;
                    const taskError = this.classifyError(error);
                    execution.fail(taskError);
                },
                complete: () => {
                    execution.signal.removeEventListener('abort', onAbort);
                    if (execution.isSettled || execution.signal.aborted)
                        return;
                    if (lastValue !== undefined) {
                        execution.succeed(lastValue);
                    }
                    else {
                        execution.succeed(undefined);
                    }
                },
            });
        }
        catch (syncError) {
            execution.signal.removeEventListener('abort', onAbort);
            if (execution.isSettled || execution.signal.aborted)
                return;
            const taskError = this.classifyError(syncError);
            execution.fail(taskError);
        }
    }
    run(execution) {
        const context = execution.createContext();
        try {
            const observable = this.handler(execution.args, context);
            this.runWithObservable(execution, observable);
        }
        catch (syncError) {
            if (execution.isSettled || execution.signal.aborted)
                return;
            const taskError = this.classifyError(syncError);
            execution.fail(taskError);
        }
    }
}
exports.ObservableOperationAdapter = ObservableOperationAdapter;
//# sourceMappingURL=observable-adapter.js.map