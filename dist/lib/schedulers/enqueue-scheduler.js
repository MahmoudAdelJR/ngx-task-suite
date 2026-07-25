"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnqueueScheduler = void 0;
class EnqueueScheduler {
    active = null;
    queue = [];
    maxQueueSize;
    overflowPolicy;
    constructor(options = {}) {
        this.maxQueueSize = options.maxQueueSize ?? Number.POSITIVE_INFINITY;
        this.overflowPolicy = options.overflowPolicy ?? 'reject-newest';
    }
    get activeExecutions() {
        return (this.active && !this.active.isSettled) ? [this.active] : [];
    }
    get queuedExecutions() {
        return this.queue.map(item => item.execution);
    }
    get runningCount() {
        return (this.active && !this.active.isSettled) ? 1 : 0;
    }
    get queuedCount() {
        return this.queue.length;
    }
    schedule(execution, runOperation) {
        if (!this.active || this.active.isSettled) {
            this.runNext(execution, runOperation);
            return;
        }
        if (this.queue.length >= this.maxQueueSize) {
            switch (this.overflowPolicy) {
                case 'reject-newest':
                    execution.drop();
                    return;
                case 'drop-oldest': {
                    const oldest = this.queue.shift();
                    oldest?.execution.supersede();
                    break;
                }
                case 'throw':
                    execution.drop();
                    throw new Error(`Queue overflow limit (${this.maxQueueSize}) reached.`);
            }
        }
        execution.queue();
        this.queue.push({ execution, runOperation });
    }
    runNext(execution, runOperation) {
        this.active = execution;
        execution.start();
        execution.addListener({
            onStatusChange: () => {
                if (execution.isSettled && this.active === execution) {
                    this.active = null;
                    if (this.queue.length > 0) {
                        const next = this.queue.shift();
                        this.runNext(next.execution, next.runOperation);
                    }
                }
            },
        });
        runOperation(execution);
    }
    cancelAll(reason) {
        const activeExec = this.active;
        const queuedItems = [...this.queue];
        this.active = null;
        this.queue = [];
        activeExec?.cancel(reason);
        for (const q of queuedItems) {
            q.execution.cancel(reason);
        }
    }
    cancelExecution(id, reason) {
        if (this.active && this.active.id === id) {
            const activeExec = this.active;
            this.active = null;
            activeExec.cancel(reason);
            return;
        }
        const index = this.queue.findIndex(item => item.execution.id === id);
        if (index !== -1) {
            const [queuedItem] = this.queue.splice(index, 1);
            queuedItem.execution.cancel(reason);
        }
    }
}
exports.EnqueueScheduler = EnqueueScheduler;
//# sourceMappingURL=enqueue-scheduler.js.map