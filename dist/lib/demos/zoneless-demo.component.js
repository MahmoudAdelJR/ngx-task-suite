"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZonelessDemoComponent = void 0;
const core_1 = require("@angular/core");
const create_task_js_1 = require("../angular/create-task.js");
let ZonelessDemoComponent = class ZonelessDemoComponent {
    calculate = (0, create_task_js_1.createTask)(async (num) => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return num * 10;
    });
};
exports.ZonelessDemoComponent = ZonelessDemoComponent;
exports.ZonelessDemoComponent = ZonelessDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-zoneless-demo',
        standalone: true,
        template: `
    <button (click)="calculate.run(42)">Calculate</button>
    @if (calculate.pending()) { Computing in Zoneless mode... }
    @if (calculate.result(); as val) {
      <p>Result: {{ val }}</p>
    }
  `,
    })
], ZonelessDemoComponent);
//# sourceMappingURL=zoneless-demo.component.js.map