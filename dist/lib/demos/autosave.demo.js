"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutosaveDemoComponent = void 0;
const core_1 = require("@angular/core");
const create_task_js_1 = require("../angular/create-task.js");
let AutosaveDemoComponent = class AutosaveDemoComponent {
    autosaveTask = (0, create_task_js_1.createTask)(async (text) => {
        await new Promise(resolve => setTimeout(resolve, 40));
        return { savedLength: text.length, time: Date.now() };
    }, {
        concurrency: 'latest',
    });
    onContentChange(event) {
        const text = event.target.value;
        this.autosaveTask.run(text);
    }
};
exports.AutosaveDemoComponent = AutosaveDemoComponent;
exports.AutosaveDemoComponent = AutosaveDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-autosave-demo',
        standalone: true,
        template: `
    <textarea (input)="onContentChange($event)"></textarea>
    <span>Status: {{ autosaveTask.status() }}</span>
  `,
    })
], AutosaveDemoComponent);
//# sourceMappingURL=autosave.demo.js.map