"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchFileUploadDemoComponent = void 0;
const core_1 = require("@angular/core");
const create_task_js_1 = require("../angular/create-task.js");
let BatchFileUploadDemoComponent = class BatchFileUploadDemoComponent {
    uploadTask = (0, create_task_js_1.createTask)(async (fileName, ctx) => {
        ctx.reportProgress({ current: 50, total: 100, message: `Uploading ${fileName}` });
        await new Promise(resolve => setTimeout(resolve, 40));
        return { uploadedFile: fileName };
    }, {
        concurrency: { mode: 'parallel', limit: 3 },
    });
    uploadFiles(fileNames) {
        for (const name of fileNames) {
            this.uploadTask.run(name);
        }
    }
};
exports.BatchFileUploadDemoComponent = BatchFileUploadDemoComponent;
exports.BatchFileUploadDemoComponent = BatchFileUploadDemoComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-batch-file-upload-demo',
        standalone: true,
        template: `
    <span>Active Uploads: {{ uploadTask.runningCount() }}</span>
    <span>Queued Uploads: {{ uploadTask.queuedCount() }}</span>
  `,
    })
], BatchFileUploadDemoComponent);
//# sourceMappingURL=batch-file-upload.demo.js.map