"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatestScheduler = void 0;
class LatestScheduler {
    active = null;
    queued = null;
    get activeExecutions() {
        return (this.active && !this.active.isSettled) ? [this.active] : [];
    }
    get queuedExecutions() {
        return this.queued ? [this.queued.execution] : [];
    }
    get runningCount() {
        return (this.active && !this.active.isSettled) ? 1 : 0;
    }
    get queuedCount() {
        return this.queued ? 1 : 0;
    }
    schedule(execution, runOperation) {
        if (!this.active || this.active.isSettled) {
            this.runNext(execution, runOperation);
            return;
        }
        if (this.queued) {
            const oldQueued = this.queued;
            this.queued = null;
            oldQueued.execution.supersede();
        }
        this.queued = { execution, runOperation };
        execution.queue();
    }
    runNext(execution, runOperation) {
        this.active = execution;
        execution.start();
        execution.addListener({
            onStatusChange: () => {
                if (execution.isSettled && this.active === execution) {
                    this.active = null;
                    if (this.queued) {
                        const next = this.queued;
                        this.queued = null;
                        this.runNext(next.execution, next.runOperation);
                    }
                }
            },
        });
        runOperation(execution);
    }
    cancelAll(reason) {
        const activeExec = this.active;
        const queuedExec = this.queued;
        this.active = null;
        this.queued = null;
        activeExec?.cancel(reason);
        queuedExec?.execution.cancel(reason);
    }
    cancelExecution(id, reason) {
        if (this.active && this.active.id === id) {
            const activeExec = this.active;
            this.active = null;
            activeExec.cancel(reason);
            return;
        }
        if (this.queued && this.queued.execution.id === id) {
            const queuedExec = this.queued;
            this.queued = null;
            queuedExec.execution.cancel(reason);
        }
    }
}
exports.LatestScheduler = LatestScheduler;
//# sourceMappingURL=latest-scheduler.js.map