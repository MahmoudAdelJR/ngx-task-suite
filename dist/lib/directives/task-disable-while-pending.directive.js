"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDisableWhilePendingDirective = void 0;
const core_1 = require("@angular/core");
let TaskDisableWhilePendingDirective = class TaskDisableWhilePendingDirective {
    triggerDirective;
    explicitTask;
    taskDisableMode = 'native';
    constructor(triggerDirective) {
        this.triggerDirective = triggerDirective;
    }
    get targetTask() {
        return this.explicitTask || this.triggerDirective?.task;
    }
    get isPending() {
        return this.targetTask?.pending() ?? false;
    }
    get nativeDisabled() {
        if (this.taskDisableMode === 'native' && this.isPending) {
            return true;
        }
        return null;
    }
    get ariaDisabled() {
        if (this.taskDisableMode === 'aria' && this.isPending) {
            return 'true';
        }
        return null;
    }
};
exports.TaskDisableWhilePendingDirective = TaskDisableWhilePendingDirective;
exports.TaskDisableWhilePendingDirective = TaskDisableWhilePendingDirective = __decorate([
    (0, core_1.Directive)({
        selector: '[taskDisableWhilePending]',
        standalone: true,
        inputs: ['explicitTask: taskDisableWhilePending', 'taskDisableMode'],
        host: {
            '[disabled]': 'nativeDisabled',
            '[attr.aria-disabled]': 'ariaDisabled',
        },
    }),
    __param(0, (0, core_1.Optional)()),
    __param(0, (0, core_1.Self)())
], TaskDisableWhilePendingDirective);
//# sourceMappingURL=task-disable-while-pending.directive.js.map