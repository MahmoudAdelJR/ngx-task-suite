"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControlledTaskHandler = createControlledTaskHandler;
exports.createTaskHarness = createTaskHarness;
const deferred_js_1 = require("./deferred.js");
function createControlledTaskHandler() {
    const invocations = [];
    const deferredMap = new Map();
    const handler = (args, context) => {
        const deferred = (0, deferred_js_1.createDeferred)();
        deferredMap.set(context.executionId, deferred);
        invocations.push({ id: context.executionId, args, context });
        return deferred.promise;
    };
    const resolve = (executionId, value) => {
        const deferred = deferredMap.get(executionId);
        if (deferred) {
            deferred.resolve(value);
        }
    };
    const reject = (executionId, error) => {
        const deferred = deferredMap.get(executionId);
        if (deferred) {
            deferred.reject(error);
        }
    };
    const reportProgress = (executionId, progress) => {
        const inv = invocations.find(i => i.id === executionId);
        if (inv) {
            inv.context.reportProgress(progress);
        }
    };
    const resolveLast = (value) => {
        const last = invocations[invocations.length - 1];
        if (last) {
            resolve(last.id, value);
        }
    };
    const rejectLast = (error) => {
        const last = invocations[invocations.length - 1];
        if (last) {
            reject(last.id, error);
        }
    };
    return {
        handler,
        invocations,
        resolve,
        reject,
        reportProgress,
        resolveLast,
        rejectLast,
    };
}
function createTaskHarness(task) {
    return {
        task,
        get lastExecution() {
            return task.lastExecution();
        },
        cancelLast(reason) {
            task.cancel(reason);
        },
    };
}
//# sourceMappingURL=harness.js.map