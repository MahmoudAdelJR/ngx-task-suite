---
title: Zoneless Angular Integration
description: Using ngx-task in Zoneless Angular applications with native signal reactivity.
---

Angular 18+ introduces support for **Zoneless change detection** (`provideExperimentalZonelessChangeDetection()`).

Because `ngx-task` relies entirely on Angular `Signal` primitives (`signal()`, `computed()`) rather than Zone.js macrotask patching, it works natively and seamlessly in Zoneless applications.

---

## Setting Up Zoneless Angular

In your `app.config.ts`:

```ts title="app.config.ts"
import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ],
};
```

---

## Why `ngx-task` Excel in Zoneless Apps

1. **Direct Signal Updates**: Signal updates from `ngx-task` automatically schedule change detection passes in Zoneless mode without requiring `ChangeDetectorRef.markForCheck()`.
2. **Fine-Grained DOM Updates**: Template control flow (`@if (task.pending())`, `@if (task.result())`) updates precisely the DOM nodes bound to the signals.
3. **No Zone Pollution**: Task timers (`pendingDelay`, `minimumPendingDuration`, `timeout`) use native `setTimeout` / `clearTimeout` without triggering unnecessary global Zone CD cycles.
