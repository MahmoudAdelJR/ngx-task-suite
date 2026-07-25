"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionStateMachine = void 0;
const SETTLED_STATUSES = new Set([
    'succeeded',
    'failed',
    'cancelled',
    'superseded',
    'dropped',
    'timed-out',
]);
class ExecutionStateMachine {
    id;
    args;
    createdAt;
    attempt;
    idempotencyKey;
    _status = 'created';
    _startedAt;
    _finishedAt;
    _progress;
    _result;
    _error;
    abortController = new AbortController();
    done;
    resolveDone;
    listeners = new Set();
    constructor(id, args, attempt = 1, idempotencyKey) {
        this.id = id;
        this.args = args;
        this.createdAt = Date.now();
        this.attempt = attempt;
        this.idempotencyKey = idempotencyKey ?? id;
        this.done = new Promise((resolve) => {
            this.resolveDone = resolve;
        });
    }
    get status() {
        return this._status;
    }
    get startedAt() {
        return this._startedAt;
    }
    get finishedAt() {
        return this._finishedAt;
    }
    get progress() {
        return this._progress;
    }
    get result() {
        return this._result;
    }
    get error() {
        return this._error;
    }
    get isSettled() {
        return SETTLED_STATUSES.has(this._status);
    }
    get isRunning() {
        return this._status === 'running';
    }
    get isQueued() {
        return this._status === 'queued';
    }
    get signal() {
        return this.abortController.signal;
    }
    addListener(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    createContext(reportProgressOverride) {
        return {
            signal: this.signal,
            executionId: this.id,
            attempt: this.attempt,
            idempotencyKey: this.idempotencyKey,
            reportProgress: (progress) => {
                if (reportProgressOverride) {
                    reportProgressOverride(progress);
                }
                else {
                    this.reportProgress(progress);
                }
            },
            throwIfCancelled: () => {
                if (this.signal.aborted) {
                    throw this.signal.reason ?? new Error(`Task execution ${this.id} was cancelled.`);
                }
            },
        };
    }
    queue() {
        if (this._status !== 'created')
            return false;
        this._status = 'queued';
        this.notifyStatus();
        return true;
    }
    start() {
        if (this._status !== 'created' && this._status !== 'queued')
            return false;
        this._status = 'running';
        this._startedAt = Date.now();
        this.notifyStatus();
        return true;
    }
    succeed(value) {
        if (this._status !== 'running') {
            // Late resolution ignored after settlement
            return false;
        }
        this._status = 'succeeded';
        this._result = value;
        this._finishedAt = Date.now();
        this.notifyStatus();
        this.notifyResult();
        this.resolveDone({ type: 'success', value });
        return true;
    }
    fail(error) {
        if (this._status !== 'running') {
            // Late rejection ignored after settlement
            return false;
        }
        this._status = 'failed';
        this._error = error;
        this._finishedAt = Date.now();
        this.notifyStatus();
        this.notifyError();
        this.resolveDone({ type: 'failure', error });
        return true;
    }
    cancel(reason) {
        if (this.isSettled)
            return false;
        const wasRunningOrQueued = this._status === 'running' || this._status === 'queued';
        this._status = 'cancelled';
        this._finishedAt = Date.now();
        this.abortController.abort(reason ?? 'cancelled');
        this.notifyStatus();
        this.resolveDone({ type: 'cancelled', reason });
        return wasRunningOrQueued;
    }
    supersede() {
        if (this.isSettled)
            return false;
        this._status = 'superseded';
        this._finishedAt = Date.now();
        this.abortController.abort('superseded');
        this.notifyStatus();
        this.resolveDone({ type: 'superseded' });
        return true;
    }
    drop() {
        if (this._status !== 'created')
            return false;
        this._status = 'dropped';
        this._finishedAt = Date.now();
        this.notifyStatus();
        this.resolveDone({ type: 'dropped' });
        return true;
    }
    timeOut(error) {
        if (this._status !== 'running')
            return false;
        this._status = 'timed-out';
        this._error = error;
        this._finishedAt = Date.now();
        this.abortController.abort('timed-out');
        this.notifyStatus();
        this.notifyError();
        this.resolveDone({ type: 'timed-out', error });
        return true;
    }
    reportProgress(progress) {
        if (this.isSettled)
            return;
        this._progress = progress;
        for (const listener of this.listeners) {
            listener.onProgressChange?.(progress);
        }
    }
    async resultOrThrow() {
        const outcome = await this.done;
        switch (outcome.type) {
            case 'success':
                return outcome.value;
            case 'failure':
            case 'timed-out':
                throw outcome.error.cause ?? new Error(outcome.error.message);
            case 'cancelled':
                throw outcome.reason ?? new Error(`Task execution ${this.id} was cancelled.`);
            case 'superseded':
                throw new Error(`Task execution ${this.id} was superseded.`);
            case 'dropped':
                throw new Error(`Task execution ${this.id} was dropped.`);
        }
    }
    notifyStatus() {
        for (const listener of this.listeners) {
            listener.onStatusChange?.(this._status);
        }
    }
    notifyResult() {
        for (const listener of this.listeners) {
            listener.onResultChange?.(this._result);
        }
    }
    notifyError() {
        for (const listener of this.listeners) {
            listener.onErrorChange?.(this._error);
        }
    }
}
exports.ExecutionStateMachine = ExecutionStateMachine;
//# sourceMappingURL=execution-state-machine.js.map