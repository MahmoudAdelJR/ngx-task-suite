---
title: Installation & Setup
description: Step-by-step installation guide and peer dependencies for ngx-task in Angular applications.
---

`ngx-task` provides controlled asynchronous actions for Angular v16+ powered by Angular Signals.

## Installation

Install the package via `npm`, `pnpm`, or `yarn`:

```bash
npm install ngx-task
```

```bash
pnpm add ngx-task
```

```bash
yarn add ngx-task
```

---

## Peer Dependencies

`ngx-task` requires Angular v16+ (v17 or v18+ recommended) and RxJS:

| Dependency | Required Version |
| :--- | :--- |
| `@angular/core` | `>=16.0.0` |
| `rxjs` | `>=7.5.0` |
| `typescript` | `>=5.0.0` |

---

## Package Entry Points

The package is organized into modular entry points to optimize bundle size and tree-shaking:

```ts
// 1. Core Primitives & Signals
import { createTask, Task, TaskExecution } from 'ngx-task';

// 2. Angular Template Directives (Optional)
import { TaskTriggerDirective, TaskDisableWhilePendingDirective, TaskBusyDirective } from 'ngx-task/directives';

// 3. Unit & Integration Testing Utilities
import { createTaskHarness, createControlledTaskHandler, createTaskTestClock } from 'ngx-task/testing';
```

---

## Angular Compatibility Matrix

| Angular Version | `ngx-task` Version | Signal Support | Zoneless Support |
| :--- | :--- | :--- | :--- |
| **Angular 18+** | `^0.1.0` | Native | ✅ Native |
| **Angular 17** | `^0.1.0` | Native | ✅ Native |
| **Angular 16** | `^0.1.0` | Developer Preview | ⚠️ Experimental |
