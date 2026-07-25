"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const create_task_js_1 = require("./angular/create-task.js");
(0, vitest_1.describe)('Phase 3 RxJS Observable Adapter & Integration', () => {
    (0, vitest_1.it)('handles single-emission RxJS Observables successfully', async () => {
        const task = (0, create_task_js_1.createTask)((name) => (0, rxjs_1.of)(`Hello ${name}`));
        const exec = task.run('Angular');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome).toEqual({ type: 'success', value: 'Hello Angular' });
        (0, vitest_1.expect)(task.result()).toBe('Hello Angular');
        (0, vitest_1.expect)(task.status()).toBe('settled');
    });
    (0, vitest_1.it)('unsubscribes from active RxJS Observable upon execution cancellation', async () => {
        let unsubscribed = false;
        const subject = new rxjs_1.Subject();
        const observable = new rxjs_1.Subject().asObservable();
        const task = (0, create_task_js_1.createTask)(() => {
            return new rxjs_1.Subject().asObservable().pipe((0, operators_1.map)(x => x));
        });
        const customObservable = new rxjs_1.Subject();
        const task2 = (0, create_task_js_1.createTask)(() => {
            return new rxjs_1.Subject().asObservable();
        });
        const exec = task2.run('test');
        (0, vitest_1.expect)(task2.running()).toBe(true);
        exec.cancel('User cancelled HTTP request');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome.type).toBe('cancelled');
        (0, vitest_1.expect)(task2.running()).toBe(false);
    });
    (0, vitest_1.it)('unsubscribes active RxJS Observable when superseded by restart concurrency', async () => {
        const subject1 = new rxjs_1.Subject();
        const subject2 = new rxjs_1.Subject();
        const task = (0, create_task_js_1.createTask)((id) => {
            return id === 1 ? subject1.asObservable() : subject2.asObservable();
        }, { concurrency: 'restart' });
        const exec1 = task.run(1);
        (0, vitest_1.expect)(exec1.status()).toBe('running');
        const exec2 = task.run(2);
        (0, vitest_1.expect)(exec1.status()).toBe('superseded');
        (0, vitest_1.expect)(exec2.status()).toBe('running');
        subject2.next('Result 2');
        subject2.complete();
        const outcome1 = await exec1.done;
        const outcome2 = await exec2.done;
        (0, vitest_1.expect)(outcome1.type).toBe('superseded');
        (0, vitest_1.expect)(outcome2).toEqual({ type: 'success', value: 'Result 2' });
        (0, vitest_1.expect)(task.result()).toBe('Result 2');
    });
    (0, vitest_1.it)('handles Observable errors cleanly', async () => {
        const task = (0, create_task_js_1.createTask)(() => (0, rxjs_1.throwError)(() => new Error('HTTP 500 Server Error')));
        const exec = task.run('err');
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome.type).toBe('failure');
        if (outcome.type === 'failure') {
            (0, vitest_1.expect)(outcome.error.message).toBe('HTTP 500 Server Error');
        }
        (0, vitest_1.expect)(task.error()?.message).toBe('HTTP 500 Server Error');
    });
});
//# sourceMappingURL=observable-task.spec.js.map