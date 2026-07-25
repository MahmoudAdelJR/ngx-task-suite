---
title: Quick Start
description: Build your first Signal-powered task with cancellation, anti-flicker, and directives.
---

This guide walks you through building a profile editor component with `ngx-task`.

## 1. Create a Task

In your component, define a task using `createTask()`. A task wraps an asynchronous function (either returning a `Promise` or an `Observable`) and provides signal state (`pending`, `running`, `result`, `error`).

```ts title="profile-editor.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { TaskTriggerDirective, TaskDisableWhilePendingDirective } from 'ngx-task/directives';
import { ProfileApiService, UserProfile } from './profile-api.service';

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [TaskTriggerDirective, TaskDisableWhilePendingDirective],
  templateUrl: './profile-editor.component.html',
})
export class ProfileEditorComponent {
  private api = inject(ProfileApiService);

  userProfile: UserProfile = { name: 'Alice', email: 'alice@example.com' };

  readonly saveProfile = createTask(
    async (profile: UserProfile, { signal }) => {
      // Pass the signal to fetch / HttpClient for automatic abort on cancel
      return this.api.updateProfile(profile, { signal });
    },
    {
      concurrency: 'drop', // Prevent duplicate submissions while active
      timeout: 10_000,     // Abort if operation takes longer than 10s
      pendingDelay: 150,   // Prevent visual flash for sub-150ms requests
    },
  );
}
```

---

## 2. Bind in Template

Use Angular control flow (`@if`) and signals to render pending states, results, or errors:

```html title="profile-editor.component.html"
<form (submit)="saveProfile.run(userProfile); $event.preventDefault()">
  <input [(ngModel)]="userProfile.name" name="name" />
  <input [(ngModel)]="userProfile.email" name="email" />

  <button
    type="submit"
    [taskDisableWhilePending]="saveProfile"
  >
    @if (saveProfile.pending()) {
      <span class="spinner"></span> Saving...
    } @else {
      Save Changes
    }
  </button>

  <button
    type="button"
    (click)="saveProfile.cancel('User clicked cancel')"
    [disabled]="!saveProfile.running()"
  >
    Cancel
  </button>
</form>

@if (saveProfile.result(); as updatedUser) {
  <p class="success">Profile saved successfully for {{ updatedUser.name }}!</p>
}

@if (saveProfile.error(); as error) {
  <p class="error-msg">Failed to save: {{ error.message }}</p>
}
```

---

## 3. What Happens Under the Hood?

1. **User Clicks Save**: `saveProfile.run(userProfile)` triggers execution.
2. **Anti-Flicker Delay**: `pending` remains `false` for 150ms. If the request resolves in 50ms, `pending` never flashes `true`.
3. **Concurrency Check**: Under `drop` policy, subsequent clicks while running are ignored automatically.
4. **Lifecycle Safety**: If the component is destroyed while saving, `signal.aborted` flips to `true` and ongoing network I/O is aborted automatically.
