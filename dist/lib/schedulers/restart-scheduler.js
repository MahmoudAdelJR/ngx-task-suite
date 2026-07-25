"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestartScheduler = void 0;
class RestartScheduler {
    active = null;
    get activeExecutions() {
        return (this.active && !this.active.isSettled) ? [this.active] : [];
    }
    get queuedExecutions() {
        return [];
    }
    get runningCount() {
        return (this.active && !this.active.isSettled) ? 1 : 0;
    }
    get queuedCount() {
        return 0;
    }
    schedule(execution, runOperation) {
        if (this.active && !this.active.isSettled) {
            const previous = this.active;
            this.active = null;
            previous.supersede();
        }
        this.active = execution;
        execution.start();
        execution.addListener({
            onStatusChange: () => {
                if (execution.isSettled && this.active === execution) {
                    this.active = null;
                }
            },
        });
        runOperation(execution);
    }
    cancelAll(reason) {
        if (this.active) {
            const current = this.active;
            this.active = null;
            current.cancel(reason);
        }
    }
    cancelExecution(id, reason) {
        if (this.active && this.active.id === id) {
            const current = this.active;
            this.active = null;
            current.cancel(reason);
        }
    }
}
exports.RestartScheduler = RestartScheduler;
//# sourceMappingURL=restart-scheduler.js.map