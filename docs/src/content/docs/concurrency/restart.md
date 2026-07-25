---
title: Restart Policy
description: In-depth guide and usage examples for the restart concurrency policy in ngx-task.
---

The `restart` policy immediately cancels any active execution and starts the new invocation immediately.

```text
Invocation 1: ───[ Execution 1 (Aborted ❌) ]
Invocation 2:        └───[ Execution 2 (Aborted ❌) ]
Invocation 3:                 └───[ Execution 3 (Settled ✅) ]───► Settled
```

---

## When to Use `restart`

Use `restart` for **latest-value wins** scenarios where previous in-flight requests are stale or obsolete:
- Search autocomplete as user types
- Filter & sorting controls on data tables
- Tab switching (loading content for the newly selected tab)

---

## Code Example

```ts title="search-bar.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { SearchService } from './search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <input
      type="text"
      placeholder="Search articles..."
      (input)="onSearchInput($event)"
    />

    @if (searchTask.pending()) {
      <p class="searching">Searching...</p>
    }

    <ul>
      @for (item of searchTask.result(); track item.id) {
        <li>{{ item.title }}</li>
      }
    </ul>
  `,
})
export class SearchBarComponent {
  private searchService = inject(SearchService);

  readonly searchTask = createTask(
    async (query: string, { signal }) => {
      return this.searchService.query(query, { signal });
    },
    {
      concurrency: 'restart', // New input immediately aborts previous HTTP request
      pendingDelay: 100,      // Avoid flicker on fast typers
    },
  );

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    if (query.trim()) {
      this.searchTask.run(query);
    }
  }
}
```
