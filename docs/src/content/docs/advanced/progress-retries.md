---
title: Progress Reporting & Retries
description: Report progress updates and trigger manual retries with ngx-task.
---

`ngx-task` provides built-in mechanisms for progress tracking (e.g. file uploads) and manual task retries.

---

## 1. Progress Reporting

Handlers call `context.reportProgress()` to update `task.progress()` and `execution.progress()` signals:

```ts title="file-upload.component.ts"
const uploadTask = createTask(async (file: File, context: TaskContext) => {
  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      context.reportProgress({
        loaded: e.loaded,
        total: e.total,
        percentage: Math.round((e.loaded / e.total) * 100),
        statusText: `Uploaded ${e.loaded} of ${e.total} bytes`,
      });
    }
  };

  return sendFileXhr(xhr, file, context.signal);
});
```

### Template Consumption

```html
@if (uploadTask.progress(); as p) {
  <progress [value]="p.percentage" max="100"></progress>
  <span>{{ p.percentage }}% - {{ p.statusText }}</span>
}
```

---

## 2. Manual Retries & Attempt Counter

### Retry Last Execution

Calling `task.retryLast()` re-executes the task using the most recent arguments passed to `.run()`:

```html
@if (saveTask.error(); as error) {
  <div class="error-banner">
    <span>Failed to save.</span>
    <button (click)="saveTask.retryLast()">Retry</button>
  </div>
}
```

### Attempt Counter (`context.attempt`)

Inside the handler, `context.attempt` increments on every retry (1 for initial run, 2 for first retry, etc.):

```ts
const resilientTask = createTask(async (payload, context) => {
  console.log(`Execution attempt #${context.attempt}`);
  return sendPayload(payload, { signal: context.signal });
});
```
