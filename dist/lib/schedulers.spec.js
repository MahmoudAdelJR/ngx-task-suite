"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const execution_state_machine_js_1 = require("./core/execution-state-machine.js");
const drop_scheduler_js_1 = require("./schedulers/drop-scheduler.js");
const restart_scheduler_js_1 = require("./schedulers/restart-scheduler.js");
const enqueue_scheduler_js_1 = require("./schedulers/enqueue-scheduler.js");
const latest_scheduler_js_1 = require("./schedulers/latest-scheduler.js");
const parallel_scheduler_js_1 = require("./schedulers/parallel-scheduler.js");
const promise_adapter_js_1 = require("./adapters/promise-adapter.js");
const deferred_js_1 = require("./testing/deferred.js");
(0, vitest_1.describe)('Phase 1 Core Engine & Concurrency Schedulers', () => {
    (0, vitest_1.describe)('ExecutionStateMachine', () => {
        (0, vitest_1.it)('handles successful execution lifecycle', async () => {
            const exec = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 'test-arg');
            (0, vitest_1.expect)(exec.status).toBe('created');
            (0, vitest_1.expect)(exec.isSettled).toBe(false);
            exec.start();
            (0, vitest_1.expect)(exec.status).toBe('running');
            (0, vitest_1.expect)(exec.isRunning).toBe(true);
            exec.succeed(42);
            (0, vitest_1.expect)(exec.status).toBe('succeeded');
            (0, vitest_1.expect)(exec.isSettled).toBe(true);
            (0, vitest_1.expect)(exec.result).toBe(42);
            const outcome = await exec.done;
            (0, vitest_1.expect)(outcome).toEqual({ type: 'success', value: 42 });
            await (0, vitest_1.expect)(exec.resultOrThrow()).resolves.toBe(42);
        });
        (0, vitest_1.it)('ignores late resolution after cancellation', async () => {
            const exec = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', undefined);
            exec.start();
            exec.cancel('User cancelled');
            (0, vitest_1.expect)(exec.status).toBe('cancelled');
            // Attempt late resolution
            const res = exec.succeed('late-value');
            (0, vitest_1.expect)(res).toBe(false);
            (0, vitest_1.expect)(exec.result).toBeUndefined();
            const outcome = await exec.done;
            (0, vitest_1.expect)(outcome).toEqual({ type: 'cancelled', reason: 'User cancelled' });
            await (0, vitest_1.expect)(exec.resultOrThrow()).rejects.toThrow('User cancelled');
        });
        (0, vitest_1.it)('handles resultOrThrow on dropped/superseded/failed', async () => {
            const execDropped = new execution_state_machine_js_1.ExecutionStateMachine('e-drop', undefined);
            execDropped.drop();
            await (0, vitest_1.expect)(execDropped.resultOrThrow()).rejects.toThrow('dropped');
            const execSuper = new execution_state_machine_js_1.ExecutionStateMachine('e-super', undefined);
            execSuper.start();
            execSuper.supersede();
            await (0, vitest_1.expect)(execSuper.resultOrThrow()).rejects.toThrow('superseded');
            const execFail = new execution_state_machine_js_1.ExecutionStateMachine('e-fail', undefined);
            execFail.start();
            execFail.fail({
                cause: new Error('Network crash'),
                kind: 'network',
                message: 'Network crash',
                retryable: true,
            });
            await (0, vitest_1.expect)(execFail.resultOrThrow()).rejects.toThrow('Network crash');
        });
    });
    (0, vitest_1.describe)('PromiseOperationAdapter', () => {
        (0, vitest_1.it)('catches synchronous exceptions before promise instantiation', async () => {
            const adapter = new promise_adapter_js_1.PromiseOperationAdapter(() => {
                throw new Error('Sync throw in handler');
            });
            const exec = new execution_state_machine_js_1.ExecutionStateMachine('exec-sync-err', undefined);
            exec.start();
            adapter.run(exec);
            const outcome = await exec.done;
            (0, vitest_1.expect)(outcome.type).toBe('failure');
            if (outcome.type === 'failure') {
                (0, vitest_1.expect)(outcome.error.message).toBe('Sync throw in handler');
            }
        });
        (0, vitest_1.it)('passes AbortSignal to handler context', async () => {
            let receivedSignal;
            const adapter = new promise_adapter_js_1.PromiseOperationAdapter(async (_, ctx) => {
                receivedSignal = ctx.signal;
                return 'ok';
            });
            const exec = new execution_state_machine_js_1.ExecutionStateMachine('exec-sig', undefined);
            exec.start();
            adapter.run(exec);
            await exec.done;
            (0, vitest_1.expect)(receivedSignal).toBeDefined();
            (0, vitest_1.expect)(receivedSignal?.aborted).toBe(false);
        });
    });
    (0, vitest_1.describe)('DropScheduler', () => {
        (0, vitest_1.it)('drops invocations when active operation is running', async () => {
            const scheduler = new drop_scheduler_js_1.DropScheduler();
            const deferred1 = (0, deferred_js_1.createDeferred)();
            const deferred2 = (0, deferred_js_1.createDeferred)();
            const adapter1 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred1.promise);
            const adapter2 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred2.promise);
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 1);
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 2);
            scheduler.schedule(exec1, e => adapter1.run(e));
            scheduler.schedule(exec2, e => adapter2.run(e));
            (0, vitest_1.expect)(exec1.status).toBe('running');
            (0, vitest_1.expect)(exec2.status).toBe('dropped');
            deferred1.resolve(100);
            const outcome1 = await exec1.done;
            const outcome2 = await exec2.done;
            (0, vitest_1.expect)(outcome1).toEqual({ type: 'success', value: 100 });
            (0, vitest_1.expect)(outcome2).toEqual({ type: 'dropped' });
        });
        (0, vitest_1.it)('cancels active execution on cancelAll', async () => {
            const scheduler = new drop_scheduler_js_1.DropScheduler();
            const deferred = (0, deferred_js_1.createDeferred)();
            const exec = new execution_state_machine_js_1.ExecutionStateMachine('exec-c', undefined);
            scheduler.schedule(exec, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred.promise).run(e));
            (0, vitest_1.expect)(scheduler.runningCount).toBe(1);
            scheduler.cancelAll('Stop all');
            (0, vitest_1.expect)(scheduler.runningCount).toBe(0);
            (0, vitest_1.expect)(exec.status).toBe('cancelled');
        });
    });
    (0, vitest_1.describe)('RestartScheduler', () => {
        (0, vitest_1.it)('supersedes active execution when a new execution starts', async () => {
            const scheduler = new restart_scheduler_js_1.RestartScheduler();
            const deferred1 = (0, deferred_js_1.createDeferred)();
            const deferred2 = (0, deferred_js_1.createDeferred)();
            const adapter1 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred1.promise);
            const adapter2 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred2.promise);
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 'first');
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 'second');
            scheduler.schedule(exec1, e => adapter1.run(e));
            (0, vitest_1.expect)(exec1.status).toBe('running');
            scheduler.schedule(exec2, e => adapter2.run(e));
            (0, vitest_1.expect)(exec1.status).toBe('superseded');
            (0, vitest_1.expect)(exec2.status).toBe('running');
            deferred2.resolve('second-result');
            const outcome1 = await exec1.done;
            const outcome2 = await exec2.done;
            (0, vitest_1.expect)(outcome1).toEqual({ type: 'superseded' });
            (0, vitest_1.expect)(outcome2).toEqual({ type: 'success', value: 'second-result' });
        });
    });
    (0, vitest_1.describe)('EnqueueScheduler', () => {
        (0, vitest_1.it)('runs executions sequentially in FIFO order', async () => {
            const scheduler = new enqueue_scheduler_js_1.EnqueueScheduler();
            const deferred1 = (0, deferred_js_1.createDeferred)();
            const deferred2 = (0, deferred_js_1.createDeferred)();
            const adapter1 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred1.promise);
            const adapter2 = new promise_adapter_js_1.PromiseOperationAdapter(() => deferred2.promise);
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 1);
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 2);
            scheduler.schedule(exec1, e => adapter1.run(e));
            scheduler.schedule(exec2, e => adapter2.run(e));
            (0, vitest_1.expect)(exec1.status).toBe('running');
            (0, vitest_1.expect)(exec2.status).toBe('queued');
            (0, vitest_1.expect)(scheduler.queuedCount).toBe(1);
            deferred1.resolve(10);
            await exec1.done;
            (0, vitest_1.expect)(exec2.status).toBe('running');
            (0, vitest_1.expect)(scheduler.queuedCount).toBe(0);
            deferred2.resolve(20);
            const outcome2 = await exec2.done;
            (0, vitest_1.expect)(outcome2).toEqual({ type: 'success', value: 20 });
        });
        (0, vitest_1.it)('handles queue overflow with drop-oldest policy', async () => {
            const scheduler = new enqueue_scheduler_js_1.EnqueueScheduler({
                maxQueueSize: 1,
                overflowPolicy: 'drop-oldest',
            });
            const deferred1 = (0, deferred_js_1.createDeferred)();
            const deferred2 = (0, deferred_js_1.createDeferred)();
            const deferred3 = (0, deferred_js_1.createDeferred)();
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 1);
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 2);
            const exec3 = new execution_state_machine_js_1.ExecutionStateMachine('exec-3', 3);
            scheduler.schedule(exec1, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred1.promise).run(e));
            scheduler.schedule(exec2, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred2.promise).run(e));
            scheduler.schedule(exec3, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred3.promise).run(e));
            (0, vitest_1.expect)(exec1.status).toBe('running');
            (0, vitest_1.expect)(exec2.status).toBe('superseded');
            (0, vitest_1.expect)(exec3.status).toBe('queued');
        });
    });
    (0, vitest_1.describe)('LatestScheduler', () => {
        (0, vitest_1.it)('completes active execution and runs only newest queued execution', async () => {
            const scheduler = new latest_scheduler_js_1.LatestScheduler();
            const deferred1 = (0, deferred_js_1.createDeferred)();
            const deferred2 = (0, deferred_js_1.createDeferred)();
            const deferred3 = (0, deferred_js_1.createDeferred)();
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 1);
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 2);
            const exec3 = new execution_state_machine_js_1.ExecutionStateMachine('exec-3', 3);
            scheduler.schedule(exec1, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred1.promise).run(e));
            scheduler.schedule(exec2, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred2.promise).run(e));
            scheduler.schedule(exec3, e => new promise_adapter_js_1.PromiseOperationAdapter(() => deferred3.promise).run(e));
            (0, vitest_1.expect)(exec1.status).toBe('running');
            (0, vitest_1.expect)(exec2.status).toBe('superseded');
            (0, vitest_1.expect)(exec3.status).toBe('queued');
            deferred1.resolve(100);
            await exec1.done;
            (0, vitest_1.expect)(exec3.status).toBe('running');
            deferred3.resolve(300);
            const outcome3 = await exec3.done;
            (0, vitest_1.expect)(outcome3).toEqual({ type: 'success', value: 300 });
        });
    });
    (0, vitest_1.describe)('ParallelScheduler', () => {
        (0, vitest_1.it)('executes up to limit simultaneously and queues remaining', async () => {
            const scheduler = new parallel_scheduler_js_1.ParallelScheduler({ limit: 2 });
            const d1 = (0, deferred_js_1.createDeferred)();
            const d2 = (0, deferred_js_1.createDeferred)();
            const d3 = (0, deferred_js_1.createDeferred)();
            const exec1 = new execution_state_machine_js_1.ExecutionStateMachine('exec-1', 1);
            const exec2 = new execution_state_machine_js_1.ExecutionStateMachine('exec-2', 2);
            const exec3 = new execution_state_machine_js_1.ExecutionStateMachine('exec-3', 3);
            scheduler.schedule(exec1, e => new promise_adapter_js_1.PromiseOperationAdapter(() => d1.promise).run(e));
            scheduler.schedule(exec2, e => new promise_adapter_js_1.PromiseOperationAdapter(() => d2.promise).run(e));
            scheduler.schedule(exec3, e => new promise_adapter_js_1.PromiseOperationAdapter(() => d3.promise).run(e));
            (0, vitest_1.expect)(scheduler.runningCount).toBe(2);
            (0, vitest_1.expect)(scheduler.queuedCount).toBe(1);
            (0, vitest_1.expect)(exec1.status).toBe('running');
            (0, vitest_1.expect)(exec2.status).toBe('running');
            (0, vitest_1.expect)(exec3.status).toBe('queued');
            d1.resolve(10);
            await exec1.done;
            (0, vitest_1.expect)(scheduler.runningCount).toBe(2);
            (0, vitest_1.expect)(exec3.status).toBe('running');
        });
    });
});
//# sourceMappingURL=schedulers.spec.js.map