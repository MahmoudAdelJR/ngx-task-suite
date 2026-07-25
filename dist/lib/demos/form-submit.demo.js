"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSubmitDemoComponent = void 0;
const core_1 = require("@angular/core");
const create_task_js_1 = require("../angular/create-task.js");
const task_trigger_directive_js_1 = require("../directives/task-trigger.directive.js");
const task_disable_while_pending_directive_js_1 = require("../directives/task-disable-while-pending.directive.js");
let FormSubmitDemoComponent = class FormSubmitDemoComponent {
    formData = { title: 'New Item' };
    saveTask = (0, create_task_js_1.createTask)(async (data, { signal }) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true, savedTitle: data.title };
    }, {
        concurrency: 'drop',
        pendingDelay: 20,
    });
};
exports.FormSubmitDemoComponent = FormSubmitDemoComponent;
exports.FormSubmitDemoComponent = FormSubmitDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-form-submit-demo',
        standalone: true,
        imports: [task_trigger_directive_js_1.TaskTriggerDirective, task_disable_while_pending_directive_js_1.TaskDisableWhilePendingDirective],
        template: `
    <button
      type="button"
      [taskTrigger]="saveTask"
      [taskArgs]="formData"
      taskDisableWhilePending
    >
      @if (saveTask.pending()) { Saving... } @else { Save Form }
    </button>
  `,
    })
], FormSubmitDemoComponent);
//# sourceMappingURL=form-submit.demo.js.map