"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequentialAuditLogDemoComponent = void 0;
const core_1 = require("@angular/core");
const create_task_js_1 = require("../angular/create-task.js");
let SequentialAuditLogDemoComponent = class SequentialAuditLogDemoComponent {
    auditTask = (0, create_task_js_1.createTask)(async (action) => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return { action, processedAt: Date.now() };
    }, {
        concurrency: 'enqueue',
        maxQueueSize: 10,
        overflowPolicy: 'reject-newest',
    });
    logEvent(action) {
        this.auditTask.run(action);
    }
};
exports.SequentialAuditLogDemoComponent = SequentialAuditLogDemoComponent;
exports.SequentialAuditLogDemoComponent = SequentialAuditLogDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-sequential-audit-log-demo',
        standalone: true,
        template: `
    <button (click)="logEvent('ACTION_1')">Log 1</button>
    <button (click)="logEvent('ACTION_2')">Log 2</button>
    <span>Queued: {{ auditTask.queuedCount() }}</span>
  `,
    })
], SequentialAuditLogDemoComponent);
//# sourceMappingURL=sequential-audit-log.demo.js.map