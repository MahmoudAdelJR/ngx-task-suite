"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAutocompleteDemoComponent = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const create_task_js_1 = require("../angular/create-task.js");
let SearchAutocompleteDemoComponent = class SearchAutocompleteDemoComponent {
    searchTask = (0, create_task_js_1.createTask)((query) => {
        return (0, rxjs_1.of)([`${query} suggestion 1`, `${query} suggestion 2`]).pipe((0, operators_1.delay)(30));
    }, {
        concurrency: 'restart',
    });
    onSearch(event) {
        const value = event.target.value;
        this.searchTask.run(value);
    }
};
exports.SearchAutocompleteDemoComponent = SearchAutocompleteDemoComponent;
exports.SearchAutocompleteDemoComponent = SearchAutocompleteDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-search-autocomplete-demo',
        standalone: true,
        template: `
    <input (input)="onSearch($event)" placeholder="Search..." />
    @if (searchTask.running()) { Loading suggestions... }
    <ul>
      @for (item of searchTask.result() || []; track item) {
        <li>{{ item }}</li>
      }
    </ul>
  `,
    })
], SearchAutocompleteDemoComponent);
//# sourceMappingURL=search-autocomplete.demo.js.map