"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const create_task_js_1 = require("./angular/create-task.js");
const deferred_js_1 = require("./testing/deferred.js");
(0, vitest_1.describe)('Phase 4 Advanced Production Features', () => {
    (0, vitest_1.it)('triggers timeout when execution exceeds configured timeout ms', async () => {
        const deferred = (0, deferred_js_1.createDeferred)();
        const task = (0, create_task_js_1.createTask)(() => deferred.promise, {
            timeout: 50,
        });
        const exec = task.run(undefined);
        (0, vitest_1.expect)(exec.status()).toBe('running');
        // Wait for timeout to fire
        await new Promise(resolve => setTimeout(resolve, 80));
        (0, vitest_1.expect)(exec.status()).toBe('timed-out');
        (0, vitest_1.expect)(exec.error()?.kind).toBe('timeout');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome.type).toBe('timed-out');
        deferred.resolve('late resolution after timeout');
    });
    (0, vitest_1.it)('classifies errors using custom classifyError hook', async () => {
        class CustomNetworkError extends Error {
            code = 503;
        }
        const task = (0, create_task_js_1.createTask)(() => {
            throw new CustomNetworkError('Service Unavailable');
        }, {
            classifyError: (err) => {
                if (err instanceof CustomNetworkError) {
                    return {
                        cause: err,
                        kind: 'network',
                        message: err.message,
                        retryable: true,
                        statusCode: err.code,
                    };
                }
                return {
                    cause: err,
                    kind: 'unknown',
                    message: 'Unknown',
                    retryable: false,
                };
            },
        });
        const exec = task.run(undefined);
        await exec.done;
        (0, vitest_1.expect)(task.error()).toEqual({
            cause: vitest_1.expect.any(CustomNetworkError),
            kind: 'network',
            message: 'Service Unavailable',
            retryable: true,
            statusCode: 503,
        });
    });
    (0, vitest_1.it)('tracks progress via TaskContext.reportProgress', async () => {
        const deferred = (0, deferred_js_1.createDeferred)();
        const task = (0, create_task_js_1.createTask)(async (_, ctx) => {
            ctx.reportProgress({ current: 25, total: 100, message: 'Downloading...' });
            ctx.reportProgress({ current: 75, total: 100, message: 'Extracting...' });
            await deferred.promise;
        });
        const exec = task.run(undefined);
        (0, vitest_1.expect)(exec.progress()).toEqual({ current: 75, total: 100, message: 'Extracting...' });
        (0, vitest_1.expect)(task.progress()).toEqual({ current: 75, total: 100, message: 'Extracting...' });
        deferred.resolve();
        await exec.done;
    });
    (0, vitest_1.it)('respects pendingDelay anti-flicker option for fast executions', async () => {
        // Fast execution completes in 10ms, but pendingDelay is 100ms
        const task = (0, create_task_js_1.createTask)(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'fast-result';
        }, {
            pendingDelay: 100,
        });
        const exec = task.run(undefined);
        (0, vitest_1.expect)(task.running()).toBe(true);
        (0, vitest_1.expect)(task.pending()).toBe(false); // Delayed!
        await exec.done;
        (0, vitest_1.expect)(task.running()).toBe(false);
        (0, vitest_1.expect)(task.pending()).toBe(false); // Never flashed true!
    });
});
//# sourceMappingURL=production-features.spec.js.map