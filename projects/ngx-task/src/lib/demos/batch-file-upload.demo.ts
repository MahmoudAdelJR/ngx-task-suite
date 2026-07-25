import { Component } from '@angular/core';
import { createTask } from '../angular/create-task.js';

@Component({
  selector: 'app-batch-file-upload-demo',
  standalone: true,
  template: `
    <span>Active Uploads: {{ uploadTask.runningCount() }}</span>
    <span>Queued Uploads: {{ uploadTask.queuedCount() }}</span>
  `,
})
export class BatchFileUploadDemoComponent {
  readonly uploadTask = createTask(
    async (fileName: string, ctx) => {
      ctx.reportProgress({ current: 50, total: 100, message: `Uploading ${fileName}` });
      await new Promise(resolve => setTimeout(resolve, 40));
      return { uploadedFile: fileName };
    },
    {
      concurrency: { mode: 'parallel', limit: 3 },
    },
  );

  uploadFiles(fileNames: string[]): void {
    for (const name of fileNames) {
      this.uploadTask.run(name);
    }
  }
}
