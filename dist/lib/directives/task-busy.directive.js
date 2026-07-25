"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBusyDirective = void 0;
const core_1 = require("@angular/core");
let TaskBusyDirective = class TaskBusyDirective {
    task;
    get isPending() {
        return this.task?.pending() ?? false;
    }
    get ariaBusy() {
        return this.isPending ? 'true' : null;
    }
    get dataPending() {
        return this.isPending ? 'true' : null;
    }
};
exports.TaskBusyDirective = TaskBusyDirective;
exports.TaskBusyDirective = TaskBusyDirective = __decorate([
    (0, core_1.Directive)({
        selector: '[taskBusy]',
        standalone: true,
        inputs: ['task: taskBusy'],
        host: {
            '[attr.aria-busy]': 'ariaBusy',
            '[attr.data-task-pending]': 'dataPending',
        },
    })
], TaskBusyDirective);
//# sourceMappingURL=task-busy.directive.js.map