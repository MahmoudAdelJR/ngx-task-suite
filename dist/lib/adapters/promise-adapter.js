"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseOperationAdapter = void 0;
exports.defaultClassifyError = defaultClassifyError;
function defaultClassifyError(error) {
    if (error && typeof error === 'object' && 'kind' in error && 'message' in error) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
        cause: error,
        kind: 'application',
        message: message || 'An error occurred during task execution',
        retryable: false,
    };
}
class PromiseOperationAdapter {
    handler;
    classifyError;
    constructor(handler, classifyError) {
        this.handler = handler;
        this.classifyError = classifyError ?? defaultClassifyError;
    }
    run(execution) {
        const context = execution.createContext();
        try {
            const resultPromise = this.handler(execution.args, context);
            Promise.resolve(resultPromise).then((value) => {
                execution.succeed(value);
            }, (error) => {
                if (execution.signal.aborted) {
                    execution.cancel(error);
                    return;
                }
                const taskError = this.classifyError(error);
                execution.fail(taskError);
            });
        }
        catch (syncError) {
            if (execution.signal.aborted) {
                execution.cancel(syncError);
                return;
            }
            const taskError = this.classifyError(syncError);
            execution.fail(taskError);
        }
    }
}
exports.PromiseOperationAdapter = PromiseOperationAdapter;
//# sourceMappingURL=promise-adapter.js.map