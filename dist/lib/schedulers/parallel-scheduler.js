"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelScheduler = void 0;
class ParallelScheduler {
    active = new Map();
    queue = [];
    limit;
    maxQueueSize;
    overflowPolicy;
    constructor(options = {}) {
        this.limit = options.limit ?? Number.POSITIVE_INFINITY;
        this.maxQueueSize = options.maxQueueSize ?? Number.POSITIVE_INFINITY;
        this.overflowPolicy = options.overflowPolicy ?? 'reject-newest';
    }
    get activeExecutions() {
        return Array.from(this.active.values()).filter(e => !e.isSettled);
    }
    get queuedExecutions() {
        return this.queue.map(item => item.execution);
    }
    get runningCount() {
        return Array.from(this.active.values()).filter(e => !e.isSettled).length;
    }
    get queuedCount() {
        return this.queue.length;
    }
    schedule(execution, runOperation) {
        if (this.runningCount < this.limit) {
            this.runExecution(execution, runOperation);
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
                    throw new Error(`Parallel queue limit (${this.maxQueueSize}) reached.`);
            }
        }
        execution.queue();
        this.queue.push({ execution, runOperation });
    }
    runExecution(execution, runOperation) {
        this.active.set(execution.id, execution);
        execution.start();
        execution.addListener({
            onStatusChange: () => {
                if (execution.isSettled && this.active.has(execution.id)) {
                    this.active.delete(execution.id);
                    if (this.queue.length > 0 && this.runningCount < this.limit) {
                        const next = this.queue.shift();
                        this.runExecution(next.execution, next.runOperation);
                    }
                }
            },
        });
        runOperation(execution);
    }
    cancelAll(reason) {
        const activeExecs = Array.from(this.active.values());
        const queuedItems = [...this.queue];
        this.active.clear();
        this.queue = [];
        for (const exec of activeExecs) {
            exec.cancel(reason);
        }
        for (const exec of queuedItems) {
            exec.execution.cancel(reason);
        }
    }
    cancelExecution(id, reason) {
        const activeExec = this.active.get(id);
        if (activeExec) {
            this.active.delete(id);
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
exports.ParallelScheduler = ParallelScheduler;
//# sourceMappingURL=parallel-scheduler.js.map