---
title: Template Directives (`ngx-task/directives`)
description: Declarative template integration with taskTrigger, taskDisableWhilePending, and taskBusy.
---

`ngx-task/directives` provides Angular directives to connect tasks directly to HTML elements without writing event handlers or manual disabled bindings.

```ts
import { TaskTriggerDirective, TaskDisableWhilePendingDirective, TaskBusyDirective } from 'ngx-task/directives';
```

---

## 1. `[taskTrigger]` & `[taskArgs]`

Automatically triggers `task.run(args)` on element click (or form submit):

```html
<button [taskTrigger]="saveTask" [taskArgs]="formData">
  Save Form
</button>
```

When clicked, the directive invokes `saveTask.run(formData)` and prevents default event actions.

---

## 2. `[taskDisableWhilePending]`

Automatically disables the host element whenever `task.pending()` is `true`.

### Native Mode (Default)

Sets the HTML `disabled` attribute:

```html
<button [taskTrigger]="submitTask" taskDisableWhilePending>
  Submit
</button>
```

### ARIA Mode (`mode="aria"`)

Instead of setting HTML `disabled`, sets `aria-disabled="true"` and adds `[tabindex]="-1"` for enhanced accessibility:

```html
<button
  [taskTrigger]="submitTask"
  [taskDisableWhilePending]="submitTask"
  taskDisableMode="aria"
>
  Submit
</button>
```

---

## 3. `[taskBusy]`

Toggles a CSS busy class or `aria-busy` attribute on container elements:

```html
<div [taskBusy]="loadDataTask" taskBusyClass="is-loading">
  <!-- Content overlayed while loading -->
</div>
```
