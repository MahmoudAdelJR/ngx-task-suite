---
title: Latest Policy
description: In-depth guide and usage examples for the latest concurrency policy in ngx-task.
---

The `latest` policy allows the active execution to complete, but maintains a queue capacity of 1—superseding intermediate queued invocations so that only the **most recent** invocation executes next.

```text
Active:       ───[ Execution 1 (Runs to completion) ]───►
Queue State:  Inv 2 queued... superseded by Inv 3!
Next Run:                                                └───[ Execution 3 ]───► Settled
```

---

## When to Use `latest`

Use `latest` for background synchronization where intermediate updates don't matter, but the backend must eventually reflect the absolute latest state:
- Document autosave
- Form field sync / slider dragging
- Real-time settings persistence

---

## Code Example

```ts title="document-editor.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { DocumentService } from './document.service';

@Component({
  selector: 'app-document-editor',
  standalone: true,
  template: `
    <textarea (input)="onContentChange($event)"></textarea>

    @if (autoSaveTask.pending()) {
      <span class="status">Saving...</span>
    } @else {
      <span class="status">All changes saved</span>
    }
  `,
})
export class DocumentEditorComponent {
  private docService = inject(DocumentService);

  readonly autoSaveTask = createTask(
    async (content: string, { signal }) => {
      return this.docService.saveDraft(content, { signal });
    },
    {
      concurrency: 'latest', // Finishes current save, skips intermediate edits, saves newest draft
    },
  );

  onContentChange(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.autoSaveTask.run(text);
  }
}
```
