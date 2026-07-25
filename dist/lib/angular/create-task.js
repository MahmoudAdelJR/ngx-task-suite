"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
const core_1 = require("@angular/core");
const execution_state_machine_js_1 = require("../core/execution-state-machine.js");
const promise_adapter_js_1 = require("../adapters/promise-adapter.js");
const observable_adapter_js_1 = require("../adapters/observable-adapter.js");
const drop_scheduler_js_1 = require("../schedulers/drop-scheduler.js");
const restart_scheduler_js_1 = require("../schedulers/restart-scheduler.js");
const enqueue_scheduler_js_1 = require("../schedulers/enqueue-scheduler.js");
const latest_scheduler_js_1 = require("../schedulers/latest-scheduler.js");
const parallel_scheduler_js_1 = require("../schedulers/parallel-scheduler.js");
class TaskExecutionImpl {
    stateMachine;
    id;
    args;
    createdAt;
    statusSig;
    progressSig;
    resultSig;
    errorSig;
    startedAtSig;
    finishedAtSig;
    status;
    progress;
    result;
    error;
    startedAt;
    finishedAt;
    done;
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
        this.id = stateMachine.id;
        this.args = stateMachine.args;
        this.createdAt = stateMachine.createdAt;
        this.done = stateMachine.done;
        this.statusSig = (0, core_1.signal)(stateMachine.status);
        this.progressSig = (0, core_1.signal)(stateMachine.progress);
        this.resultSig = (0, core_1.signal)(stateMachine.result);
        this.errorSig = (0, core_1.signal)(stateMachine.error);
        this.startedAtSig = (0, core_1.signal)(stateMachine.startedAt);
        this.finishedAtSig = (0, core_1.signal)(stateMachine.finishedAt);
        this.status = this.statusSig.asReadonly();
        this.progress = this.progressSig.asReadonly();
        this.result = this.resultSig.asReadonly();
        this.error = this.errorSig.asReadonly();
        this.startedAt = this.startedAtSig.asReadonly();
        this.finishedAt = this.finishedAtSig.asReadonly();
        stateMachine.addListener({
            onStatusChange: (status) => {
                this.statusSig.set(status);
                this.startedAtSig.set(stateMachine.startedAt);
                this.finishedAtSig.set(stateMachine.finishedAt);
            },
            onProgressChange: (p) => this.progressSig.set(p),
            onResultChange: (r) => this.resultSig.set(r),
            onErrorChange: (e) => this.errorSig.set(e),
        });
    }
    cancel(reason) {
        this.stateMachine.cancel(reason);
    }
    resultOrThrow() {
        return this.stateMachine.resultOrThrow();
    }
}
class TaskImpl {
    handler;
    options;
    statusSig = (0, core_1.signal)('idle');
    pendingSig = (0, core_1.signal)(false);
    runningSig = (0, core_1.signal)(false);
    resultSig = (0, core_1.signal)(undefined);
    errorSig = (0, core_1.signal)(undefined);
    progressSig = (0, core_1.signal)(undefined);
    runningCountSig = (0, core_1.signal)(0);
    queuedCountSig = (0, core_1.signal)(0);
    executionCountSig = (0, core_1.signal)(0);
    lastExecutionSig = (0, core_1.signal)(undefined);
    status = this.statusSig.asReadonly();
    pending = this.pendingSig.asReadonly();
    running = this.runningSig.asReadonly();
    result = this.resultSig.asReadonly();
    error = this.errorSig.asReadonly();
    progress = this.progressSig.asReadonly();
    runningCount = this.runningCountSig.asReadonly();
    queuedCount = this.queuedCountSig.asReadonly();
    executionCount = this.executionCountSig.asReadonly();
    lastExecution = this.lastExecutionSig.asReadonly();
    scheduler;
    classifyError;
    lastArgs;
    seq = 0;
    pendingTimer;
    pendingActiveTime;
    constructor(handler, options) {
        this.handler = handler;
        this.options = options;
        this.classifyError = options?.classifyError ?? promise_adapter_js_1.defaultClassifyError;
        this.scheduler = this.initScheduler(options);
        this.initDestroyRef(options);
    }
    run(args) {
        this.seq++;
        this.lastArgs = args;
        const executionId = `exec-${this.seq}`;
        const stateMachine = new execution_state_machine_js_1.ExecutionStateMachine(executionId, args, this.seq);
        const taskExecution = new TaskExecutionImpl(stateMachine);
        this.executionCountSig.update(c => c + 1);
        this.lastExecutionSig.set(taskExecution);
        // Timeout logic setup
        const timeoutOpt = this.options?.timeout;
        const timeoutMs = typeof timeoutOpt === 'number' ? timeoutOpt : timeoutOpt?.milliseconds;
        const timeoutMsg = typeof timeoutOpt === 'object' ? timeoutOpt.message : undefined;
        let timeoutTimer = undefined;
        stateMachine.addListener({
            onStatusChange: (status) => {
                if (status === 'running' && timeoutMs && timeoutMs > 0) {
                    timeoutTimer = setTimeout(() => {
                        const timeoutError = {
                            cause: new Error(timeoutMsg ?? `Task execution ${executionId} timed out after ${timeoutMs}ms`),
                            kind: 'timeout',
                            message: timeoutMsg ?? `Task execution ${executionId} timed out after ${timeoutMs}ms`,
                            retryable: true,
                        };
                        stateMachine.timeOut(timeoutError);
                    }, timeoutMs);
                }
                else if (stateMachine.isSettled && timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = undefined;
                }
                this.syncCountsAndStatus();
            },
            onProgressChange: (p) => this.progressSig.set(p),
            onResultChange: (res) => {
                if (res !== undefined) {
                    this.resultSig.set(res);
                    this.errorSig.set(undefined);
                }
            },
            onErrorChange: (err) => {
                if (err !== undefined) {
                    this.errorSig.set(err);
                }
            },
        });
        stateMachine.done.finally(() => {
            if (timeoutTimer) {
                clearTimeout(timeoutTimer);
                timeoutTimer = undefined;
            }
            queueMicrotask(() => this.syncCountsAndStatus());
        });
        this.scheduler.schedule(stateMachine, (exec) => {
            const context = exec.createContext();
            try {
                const handlerResult = this.handler(exec.args, context);
                if ((0, observable_adapter_js_1.isObservable)(handlerResult)) {
                    const obs = handlerResult;
                    const obsAdapter = new observable_adapter_js_1.ObservableOperationAdapter(() => obs, {
                        observableResult: this.options?.observableResult,
                        classifyError: this.classifyError,
                    });
                    obsAdapter.runWithObservable(exec, obs);
                }
                else {
                    const promiseAdapter = new promise_adapter_js_1.PromiseOperationAdapter(async () => handlerResult, this.classifyError);
                    promiseAdapter.run(exec);
                }
            }
            catch (err) {
                const taskErr = this.classifyError(err);
                exec.fail(taskErr);
            }
        });
        this.syncCountsAndStatus();
        return taskExecution;
    }
    cancel(reason) {
        const last = this.lastExecutionSig();
        last?.cancel(reason);
    }
    cancelAll(reason) {
        this.scheduler.cancelAll(reason);
        this.syncCountsAndStatus();
    }
    reset() {
        this.resultSig.set(undefined);
        this.errorSig.set(undefined);
        this.progressSig.set(undefined);
        this.statusSig.set('idle');
    }
    retryLast() {
        if (this.lastArgs !== undefined) {
            return this.run(this.lastArgs);
        }
        return undefined;
    }
    syncCountsAndStatus() {
        const rCount = this.scheduler.runningCount;
        const qCount = this.scheduler.queuedCount;
        this.runningCountSig.set(rCount);
        this.queuedCountSig.set(qCount);
        const isWorkActive = rCount > 0 || qCount > 0;
        this.runningSig.set(rCount > 0);
        this.updatePendingState(isWorkActive);
        if (isWorkActive) {
            this.statusSig.set('pending');
        }
        else if (this.executionCountSig() > 0) {
            this.statusSig.set('settled');
        }
        else {
            this.statusSig.set('idle');
        }
    }
    updatePendingState(isWorkActive) {
        const delay = this.options?.pendingDelay ?? 0;
        const minDuration = this.options?.minimumPendingDuration ?? 0;
        if (isWorkActive) {
            if (this.pendingSig()) {
                return;
            }
            if (delay > 0) {
                if (!this.pendingTimer) {
                    this.pendingTimer = setTimeout(() => {
                        this.pendingTimer = undefined;
                        if (this.scheduler.runningCount > 0 || this.scheduler.queuedCount > 0) {
                            this.pendingActiveTime = Date.now();
                            this.pendingSig.set(true);
                        }
                    }, delay);
                }
            }
            else {
                this.pendingActiveTime = Date.now();
                this.pendingSig.set(true);
            }
        }
        else {
            if (this.pendingTimer) {
                clearTimeout(this.pendingTimer);
                this.pendingTimer = undefined;
            }
            if (this.pendingSig()) {
                const elapsed = this.pendingActiveTime ? Date.now() - this.pendingActiveTime : minDuration;
                const remaining = minDuration - elapsed;
                if (remaining > 0) {
                    setTimeout(() => {
                        if (this.scheduler.runningCount === 0 && this.scheduler.queuedCount === 0) {
                            this.pendingSig.set(false);
                            this.pendingActiveTime = undefined;
                        }
                    }, remaining);
                }
                else {
                    this.pendingSig.set(false);
                    this.pendingActiveTime = undefined;
                }
            }
        }
    }
    initScheduler(options) {
        const policy = options?.concurrency ?? 'drop';
        if (typeof policy === 'object' && policy.mode === 'parallel') {
            return new parallel_scheduler_js_1.ParallelScheduler({
                limit: policy.limit,
                maxQueueSize: options?.maxQueueSize,
                overflowPolicy: options?.overflowPolicy,
            });
        }
        switch (policy) {
            case 'restart':
                return new restart_scheduler_js_1.RestartScheduler();
            case 'enqueue':
                return new enqueue_scheduler_js_1.EnqueueScheduler({
                    maxQueueSize: options?.maxQueueSize,
                    overflowPolicy: options?.overflowPolicy,
                });
            case 'latest':
                return new latest_scheduler_js_1.LatestScheduler();
            case 'drop':
            default:
                return new drop_scheduler_js_1.DropScheduler();
        }
    }
    initDestroyRef(options) {
        let destroyRef = null;
        if (options?.injector) {
            destroyRef = options.injector.get(core_1.DestroyRef, null);
        }
        else {
            try {
                destroyRef = (0, core_1.inject)(core_1.DestroyRef, { optional: true });
            }
            catch {
                // Ignored outside DI context
            }
        }
        const destroyBehavior = options?.destroyBehavior ?? 'cancel';
        if (destroyRef && destroyBehavior === 'cancel') {
            destroyRef.onDestroy(() => {
                this.cancelAll('Owner destroyed');
            });
        }
    }
}
function createTask(handler, options) {
    return new TaskImpl(handler, options);
}
//# sourceMappingURL=create-task.js.map