---
title: Drop Policy
description: In-depth guide and usage examples for the drop concurrency policy in ngx-task.
---

The `drop` policy (default in `ngx-task`) ignores any new invocation attempted while an execution is actively running.

```text
Invocation 1: ───[  Running Execution 1  ]───► Settled
Invocation 2:        └── (Dropped)
Invocation 3:               └── (Dropped)
```

---

## When to Use `drop`

Use `drop` for **non-reentrant** operations where duplicate triggers could cause data corruption, duplicate charges, or double form submissions:
- Payment / Checkout submission
- Login & Registration forms
- Destructive actions (Delete Account, Confirm Order)

---

## Code Example

```ts title="payment-form.component.ts"
import { Component, inject } from '@angular/core';
import { createTask } from 'ngx-task';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  template: `
    <button
      (click)="processPayment.run(paymentDetails)"
      [disabled]="processPayment.pending()"
    >
      @if (processPayment.pending()) {
        Processing Payment...
      } @else {
        Pay $99.00
      }
    </button>
  `,
})
export class PaymentFormComponent {
  private paymentService = inject(PaymentService);
  paymentDetails = { cardToken: 'tok_123', amount: 9900 };

  readonly processPayment = createTask(
    async (details, { signal }) => {
      return this.paymentService.charge(details, { signal });
    },
    {
      concurrency: 'drop', // Rapid double-clicks on button will be safely dropped
      timeout: 30_000,
    },
  );
}
```
