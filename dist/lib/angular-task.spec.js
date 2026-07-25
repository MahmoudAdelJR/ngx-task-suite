"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const core_1 = require("@angular/core");
const create_task_js_1 = require("./angular/create-task.js");
const deferred_js_1 = require("./testing/deferred.js");
class MockDestroyRef {
    callbacks = [];
    onDestroy(callback) {
        this.callbacks.push(callback);
        return () => {
            const idx = this.callbacks.indexOf(callback);
            if (idx !== -1)
                this.callbacks.splice(idx, 1);
        };
    }
    destroy() {
        for (const cb of this.callbacks) {
            cb();
        }
    }
}
(0, vitest_1.describe)('Phase 2 Angular Signals Facade & Lifecycle Integration', () => {
    (0, vitest_1.it)('exposes signals and updates them when task is executed', async () => {
        const deferred = (0, deferred_js_1.createDeferred)();
        const task = (0, create_task_js_1.createTask)(async (name) => {
            return await deferred.promise + ' ' + name;
        });
        (0, vitest_1.expect)(task.status()).toBe('idle');
        (0, vitest_1.expect)(task.pending()).toBe(false);
        (0, vitest_1.expect)(task.running()).toBe(false);
        (0, vitest_1.expect)(task.result()).toBeUndefined();
        (0, vitest_1.expect)(task.executionCount()).toBe(0);
        const exec = task.run('world');
        (0, vitest_1.expect)(task.status()).toBe('pending');
        (0, vitest_1.expect)(task.pending()).toBe(true);
        (0, vitest_1.expect)(task.running()).toBe(true);
        (0, vitest_1.expect)(task.runningCount()).toBe(1);
        (0, vitest_1.expect)(task.executionCount()).toBe(1);
        (0, vitest_1.expect)(task.lastExecution()?.id).toBe(exec.id);
        deferred.resolve('Hello');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome).toEqual({ type: 'success', value: 'Hello world' });
        (0, vitest_1.expect)(task.status()).toBe('settled');
        (0, vitest_1.expect)(task.pending()).toBe(false);
        (0, vitest_1.expect)(task.running()).toBe(false);
        (0, vitest_1.expect)(task.result()).toBe('Hello world');
    });
    (0, vitest_1.it)('resets task state upon reset()', async () => {
        const task = (0, create_task_js_1.createTask)(async (x) => x * 2);
        const exec = task.run(5);
        await exec.done;
        (0, vitest_1.expect)(task.result()).toBe(10);
        (0, vitest_1.expect)(task.status()).toBe('settled');
        task.reset();
        (0, vitest_1.expect)(task.result()).toBeUndefined();
        (0, vitest_1.expect)(task.status()).toBe('idle');
    });
    (0, vitest_1.it)('retries last execution with retryLast()', async () => {
        let callCount = 0;
        const task = (0, create_task_js_1.createTask)(async (x) => {
            callCount++;
            return x + callCount;
        });
        const exec1 = task.run(10);
        await exec1.done;
        (0, vitest_1.expect)(task.result()).toBe(11);
        const exec2 = task.retryLast();
        (0, vitest_1.expect)(exec2).toBeDefined();
        await exec2?.done;
        (0, vitest_1.expect)(task.result()).toBe(12);
        (0, vitest_1.expect)(callCount).toBe(2);
    });
    (0, vitest_1.it)('cancels active executions when DestroyRef triggers onDestroy', async () => {
        const mockDestroyRef = new MockDestroyRef();
        const mockInjector = {
            get: (token, notFoundValue) => {
                if (token === core_1.DestroyRef)
                    return mockDestroyRef;
                return notFoundValue;
            },
        };
        const deferred = (0, deferred_js_1.createDeferred)();
        const task = (0, create_task_js_1.createTask)(async () => deferred.promise, {
            injector: mockInjector,
            destroyBehavior: 'cancel',
        });
        const exec = task.run(undefined);
        (0, vitest_1.expect)(task.running()).toBe(true);
        mockDestroyRef.destroy();
        (0, vitest_1.expect)(task.running()).toBe(false);
        (0, vitest_1.expect)(exec.status()).toBe('cancelled');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome.type).toBe('cancelled');
    });
});
//# sourceMappingURL=angular-task.spec.js.map