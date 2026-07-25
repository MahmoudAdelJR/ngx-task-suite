---
title: Parallel Policy
description: In-depth guide and usage examples for the parallel concurrency policy in ngx-task.
---

The `parallel` policy allows up to `limit` executions to run concurrently. Excess invocations are queued until an active slot becomes free.

```text
Limit: 2

Execution 1: ───[  File 1 Upload  ]───► Settled
Execution 2: ───[  File 2 Upload  ]───────────► Settled
Execution 3: (Queued)             └───[  File 3 Upload  ]───► Settled
```

---

## When to Use `parallel`

Use `parallel` when performing batch operations where multiple independent requests can execute simultaneously without overwhelming network bandwidth or server limits:
- Bulk image/file uploads
- Batch API requests
- Preloading asset bundles concurrently

---

## Code Example

```ts title="bulk-uploader.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { FileUploadService } from './file-upload.service';

@Component({
  selector: 'app-bulk-uploader',
  standalone: true,
  template: `
    <input type="file" multiple (change)="onFilesSelected($event)" />

    <p>Active Uploads: {{ uploadTask.runningCount() }} / 3</p>
    <p>Queued Files: {{ uploadTask.queuedCount() }}</p>
  `,
})
export class BulkUploaderComponent {
  private uploadService = inject(FileUploadService);

  readonly uploadTask = createTask(
    async (file: File, { signal, reportProgress }) => {
      return this.uploadService.upload(file, { signal, reportProgress });
    },
    {
      concurrency: { mode: 'parallel', limit: 3 }, // Maximum 3 concurrent uploads
    },
  );

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach((file) => this.uploadTask.run(file));
    }
  }
}
```
