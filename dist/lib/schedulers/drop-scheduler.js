"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropScheduler = void 0;
class DropScheduler {
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
            execution.drop();
            return;
        }
        this.active = execution;
        execution.start();
        execution.addListener({
            onStatusChange: (status) => {
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
exports.DropScheduler = DropScheduler;
//# sourceMappingURL=drop-scheduler.js.map