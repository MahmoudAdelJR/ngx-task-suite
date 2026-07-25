# `ng-task` Package Plan

## 1. Package Summary

**Working package name:** `ng-task`  
**Recommended scoped name:** `@your-scope/ng-task`  
**Category:** Angular functional/behavioral library  
**Primary purpose:** Provide a signal-first abstraction for controlled asynchronous actions with explicit concurrency, cancellation, lifecycle, and execution state.

### One-line value proposition

> Signal-first asynchronous commands for Angular, with cancellation, lifecycle cleanup, and explicit concurrency policies.

### Core problem

Angular applications repeatedly implement the same async-action behavior:

- Prevent duplicate submissions
- Cancel stale requests
- Queue writes
- Limit parallel operations
- Track pending, result, and error state
- Integrate with component destruction
- Handle timeouts
- Expose reusable execution state to templates
- Support both Promise-based and Observable-based operations

`ng-task` should make those behaviors explicit and reusable.

---

## 2. Product Goals

### Primary goals

1. Make every asynchronous command declare its concurrency behavior.
2. Provide Angular-native state through read-only signals.
3. Support cooperative cancellation through `AbortSignal`.
4. Support Angular `HttpClient` Observables through unsubscription.
5. Automatically clean up component-scoped tasks.
6. Keep the core API headless and UI-framework agnostic.
7. Make scheduling logic testable without Angular TestBed.
8. Work naturally in zoneless Angular applications.
9. Provide precise execution outcomes rather than ambiguous booleans.
10. Remain smaller and more focused than a state-management or query library.

### Non-goals

The first versions should not attempt to become:

- A general state-management library
- A query-cache library
- An offline mutation queue
- A form framework
- A component library
- A global loading-overlay package
- A replacement for Angular Resources
- A replacement for RxJS

---

## 3. Target Users

### Primary users

- Angular application developers
- Angular library authors
- Teams using Signals
- Teams adopting zoneless change detection
- Teams using `HttpClient`
- Teams with complex form submission and autosave behavior

### Typical use cases

- Save form
- Submit checkout
- Login
- Delete confirmation
- Search suggestions
- Autosave document
- Upload files
- Process items sequentially
- Generate a report
- Refresh server state manually
- Run background calculations
- Execute commands from dialogs and menus

---

## 4. Design Principles

1. **Explicit concurrency**
   - Every task should have a documented behavior when invoked again while active.

2. **Execution handles**
   - Each invocation should return an object representing that specific execution.

3. **Signals for current state**
   - Aggregate task state should be exposed as Angular read-only signals.

4. **Cooperative cancellation**
   - Cancellation should use `AbortSignal` for Promises and unsubscription for Observables.

5. **No hidden swallowing**
   - Failures, cancellation, superseding, and dropping should be distinguishable.

6. **Headless core**
   - Template directives should be optional secondary entry points.

7. **Pure scheduling core**
   - Concurrency scheduling should be framework-independent TypeScript.

8. **Tree-shakable**
   - Optional integrations should live in secondary entry points.

9. **Stable terminology**
   - Use terms such as `running`, `queued`, `dropped`, `superseded`, and `cancelled` consistently.

10. **Correctness before convenience**
    - Avoid magical behavior that obscures lifecycle or execution ownership.

---

## 5. Proposed Public API

## 5.1 Basic usage

```ts
readonly saveProfile = createTask(
  async (profile: Profile, context) => {
    return this.api.saveProfile(profile, {
      signal: context.signal,
    });
  },
  {
    concurrency: 'drop',
    timeout: 15_000,
  },
);
```

```ts
const execution = this.saveProfile.run(profile);
const outcome = await execution.done;
```

Template:

```html
<button
  type="button"
  [disabled]="saveProfile.pending()"
  (click)="saveProfile.run(profile())"
>
  @if (saveProfile.pending()) {
    Saving…
  } @else {
    Save
  }
</button>
```

---

## 5.2 Main factory

```ts
export function createTask<TArgs, TResult>(
  handler: TaskHandler<TArgs, TResult>,
  options?: CreateTaskOptions<TArgs, TResult>,
): Task<TArgs, TResult>;
```

### Handler

```ts
export type TaskHandler<TArgs, TResult> = (
  args: TArgs,
  context: TaskContext,
) =>
  | PromiseLike<TResult>
  | Observable<TResult>;
```

### Context

```ts
export interface TaskContext {
  readonly signal: AbortSignal;
  readonly executionId: string;
  readonly attempt: number;
  readonly idempotencyKey: string;

  reportProgress(progress: TaskProgress): void;
  throwIfCancelled(): void;
}
```

---

## 5.3 Task object

```ts
export interface Task<TArgs, TResult> {
  readonly status: Signal<TaskStatus>;
  readonly pending: Signal<boolean>;
  readonly running: Signal<boolean>;
  readonly result: Signal<TResult | undefined>;
  readonly error: Signal<TaskError | undefined>;
  readonly progress: Signal<TaskProgress | undefined>;

  readonly runningCount: Signal<number>;
  readonly queuedCount: Signal<number>;
  readonly executionCount: Signal<number>;

  readonly lastExecution:
    Signal<TaskExecution<TArgs, TResult> | undefined>;

  run(args: TArgs): TaskExecution<TArgs, TResult>;

  cancel(reason?: unknown): void;
  cancelAll(reason?: unknown): void;
  reset(): void;
  retryLast(): TaskExecution<TArgs, TResult> | undefined;
}
```

---

## 5.4 Execution object

```ts
export interface TaskExecution<TArgs, TResult> {
  readonly id: string;
  readonly args: TArgs;

  readonly status: Signal<TaskExecutionStatus>;
  readonly progress: Signal<TaskProgress | undefined>;
  readonly result: Signal<TResult | undefined>;
  readonly error: Signal<TaskError | undefined>;

  readonly createdAt: number;
  readonly startedAt: Signal<number | undefined>;
  readonly finishedAt: Signal<number | undefined>;

  readonly done: Promise<TaskOutcome<TResult>>;

  cancel(reason?: unknown): void;
  resultOrThrow(): Promise<TResult>;
}
```

---

## 5.5 Status types

```ts
export type TaskExecutionStatus =
  | 'created'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'superseded'
  | 'dropped'
  | 'timed-out';
```

```ts
export type TaskStatus =
  | 'idle'
  | 'pending'
  | 'settled';
```

The aggregate task status should remain simple. Detailed state belongs to execution records and focused signals.

---

## 5.6 Outcomes

```ts
export type TaskOutcome<TResult> =
  | {
      readonly type: 'success';
      readonly value: TResult;
    }
  | {
      readonly type: 'failure';
      readonly error: TaskError;
    }
  | {
      readonly type: 'cancelled';
      readonly reason?: unknown;
    }
  | {
      readonly type: 'superseded';
    }
  | {
      readonly type: 'dropped';
    }
  | {
      readonly type: 'timed-out';
      readonly error: TaskError;
    };
```

`done` should always resolve to an outcome.  
`resultOrThrow()` should provide normal throwing Promise semantics.

---

## 6. Concurrency Policies

Concurrency is the central differentiator of the package.

## 6.1 `drop`

Ignore new invocations while an execution is running.

```ts
createTask(handler, {
  concurrency: 'drop',
});
```

Typical use cases:

- Checkout
- Login
- Payment submission
- Destructive actions
- Normal form submission

Expected behavior:

```text
A starts
B invoked while A runs → B becomes dropped
C invoked while A runs → C becomes dropped
A completes
```

---

## 6.2 `restart`

Cancel or supersede the active execution and start the newest invocation.

```ts
createTask(handler, {
  concurrency: 'restart',
});
```

Typical use cases:

- Search
- Live validation
- Preview generation
- Recalculation
- Selected-item details

Expected behavior:

```text
A starts
B invoked → A becomes superseded, B starts
C invoked → B becomes superseded, C starts
```

---

## 6.3 `enqueue`

Run executions sequentially in invocation order.

```ts
createTask(handler, {
  concurrency: 'enqueue',
  maxQueueSize: 20,
  overflow: 'reject-newest',
});
```

Typical use cases:

- Ordered writes
- Audit events
- Sequential uploads
- Document patches

Overflow options:

```ts
export type QueueOverflowPolicy =
  | 'reject-newest'
  | 'drop-oldest'
  | 'throw';
```

---

## 6.4 `latest`

Finish the current execution, but keep only the newest queued invocation.

```ts
createTask(handler, {
  concurrency: 'latest',
});
```

Typical use cases:

- Autosave
- Persisting settings
- Synchronizing editor state
- Saving slider or canvas state

Expected behavior:

```text
A starts
B queued
C replaces B
D replaces C
A completes
D starts
```

This should be treated as a signature feature.

---

## 6.5 `parallel`

Allow several executions to run simultaneously with an optional limit.

```ts
createTask(handler, {
  concurrency: {
    mode: 'parallel',
    limit: 3,
  },
});
```

Typical use cases:

- File uploads
- Bulk item processing
- Preloading independent resources
- Background work

When the limit is reached, additional executions should queue.

---

## 7. Cancellation Semantics

## 7.1 Promise handlers

Every execution receives an `AbortSignal`.

```ts
async function handler(
  args: Input,
  { signal }: TaskContext,
): Promise<Result> {
  return fetch('/api/action', {
    method: 'POST',
    body: JSON.stringify(args),
    signal,
  }).then(response => response.json());
}
```

Calling:

```ts
execution.cancel();
```

should:

1. Abort the internal controller.
2. Transition the execution to `cancelling` internally.
3. Ignore any late result.
4. Resolve `done` with a cancellation outcome.
5. Avoid storing cancellation as a normal application error.

Documentation must clearly state:

> Cancellation only stops the underlying operation when the operation honors the provided signal.

---

## 7.2 Observable handlers

For Observable handlers, cancellation should unsubscribe.

```ts
readonly save = createTask(
  (profile: Profile) =>
    this.http.put<Profile>('/api/profile', profile),
  {
    concurrency: 'restart',
  },
);
```

The package should normalize Observable completion, errors, emissions, and unsubscription into execution state.

---

## 7.3 Observable result policy

Initial recommended policy:

```ts
observableResult: 'latest'
```

Options for later versions:

```ts
export type ObservableResultPolicy =
  | 'first'
  | 'last'
  | 'latest'
  | 'forbid-multiple';
```

For v1, either:

- Support only single-emission Observables, or
- Use `latest` and document the behavior clearly.

Never-ending streams should be documented as a poor fit for tasks.

---

## 8. Timeouts

```ts
createTask(handler, {
  timeout: 30_000,
});
```

On timeout:

1. Request cancellation.
2. Mark execution `timed-out`.
3. Ignore late results.
4. Produce a normalized timeout error.
5. Preserve the distinction between timeout and manual cancellation.

Possible timeout configuration:

```ts
export interface TaskTimeoutOptions {
  readonly milliseconds: number;
  readonly message?: string;
}
```

Allow shorthand numeric configuration in the public API.

---

## 9. Error Model

```ts
export interface TaskError {
  readonly cause: unknown;

  readonly kind:
    | 'application'
    | 'network'
    | 'timeout'
    | 'cancelled'
    | 'unknown';

  readonly message: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
}
```

Configuration:

```ts
createTask(handler, {
  classifyError(error): TaskError {
    return customClassification(error);
  },
});
```

The core package must not depend directly on Angular HTTP errors.

A separate HTTP helper may be introduced later.

---

## 10. Retry Model

Initial manual retry support:

```ts
task.retryLast();
```

Possible later automatic policy:

```ts
retry: {
  attempts: 3,
  delay: attempt => 500 * 2 ** (attempt - 1),
  when: error => error.retryable,
}
```

Safety rule:

- Do not automatically retry non-idempotent operations by default.
- Document idempotency requirements prominently.
- Provide an execution-level `idempotencyKey`.

Suggested v1 scope:

- Manual `retryLast()`
- Attempt count
- Retry through a fresh execution
- No automatic retry until core behavior is stable

---

## 11. Progress Reporting

```ts
export interface TaskProgress {
  readonly current: number;
  readonly total?: number;
  readonly unit?: string;
  readonly message?: string;
}
```

Handler:

```ts
const upload = createTask(
  async (file: File, context) => {
    return uploadFile(file, {
      signal: context.signal,
      onProgress: progress =>
        context.reportProgress(progress),
    });
  },
);
```

Task-level aggregation for parallel work can be added after the first release.

For v1:

- Per-execution progress
- Aggregate task progress may reflect the latest or only active execution
- Document behavior explicitly

---

## 12. Pending UI Timing

Support anti-flicker timing:

```ts
createTask(handler, {
  pendingDelay: 150,
  minimumPendingDuration: 300,
});
```

Expose two different signals:

```ts
task.running(); // true immediately
task.pending(); // visual pending state
```

This prevents UI timing rules from corrupting execution truth.

---

## 13. Angular Lifecycle Integration

Tasks created in an Angular injection context should integrate with `DestroyRef`.

Default component-scoped behavior:

```text
owner destroyed
→ cancel active executions
→ clear queued executions
→ prevent further signal updates
```

Proposed option:

```ts
destroyBehavior:
  | 'cancel'
  | 'detach'
  | 'allow';
```

Recommended default:

```ts
'cancel'
```

Possible creation APIs:

```ts
createTask(handler, options);
```

and an explicitly injection-aware alternative if needed:

```ts
injectTask(handler, options);
```

Prefer one simple API if injection-context detection is reliable.

---

## 14. Zoneless Compatibility

The library should:

- Use signals for task state
- Avoid relying on `NgZone`
- Avoid manual global change detection
- Update Angular-facing state only through signals
- Keep pointer or timer mechanics outside Angular-specific assumptions where possible

Zoneless support should be part of the package identity.

Suggested README phrase:

> Signal-first and zoneless-safe by design.

---

## 15. Optional Template Directives

Keep directives in a secondary entry point:

```text
@your-scope/ng-task/directives
```

## 15.1 Trigger directive

```html
<button
  [taskTrigger]="save"
  [taskArgs]="profile()"
>
  Save
</button>
```

## 15.2 Disable while pending

```html
<button
  [taskTrigger]="save"
  [taskArgs]="profile()"
  taskDisableWhilePending
>
  Save
</button>
```

Modes:

```ts
export type TaskDisableMode =
  | 'native'
  | 'aria';
```

## 15.3 Busy attributes

```html
<section
  [taskBusy]="save"
>
```

May bind:

```html
aria-busy="true"
data-task-pending="true"
```

## 15.4 Initial recommendation

Do not include structural loading directives in v1 unless the core is already stable.

Angular control flow is sufficient:

```html
@if (save.pending()) {
  Saving…
}
```

---

## 16. Internal Architecture

## 16.1 Core package layers

```text
Core
├── execution state machine
├── schedulers
├── operation adapters
├── task facade
├── Angular signal facade
└── lifecycle integration
```

---

## 16.2 Execution state machine

Pure TypeScript.

```ts
class ExecutionStateMachine<TArgs, TResult> {
  start(): void;
  queue(): void;
  succeed(result: TResult): void;
  fail(error: TaskError): void;
  cancel(reason?: unknown): void;
  supersede(): void;
  drop(): void;
  timeOut(): void;
}
```

Valid transitions:

```text
created → queued
created → running
created → dropped

queued → running
queued → cancelled
queued → superseded

running → succeeded
running → failed
running → cancelled
running → superseded
running → timed-out
```

Invalid transitions should throw or warn in development builds.

---

## 16.3 Scheduler abstraction

```ts
interface TaskScheduler<TArgs, TResult> {
  schedule(
    execution: InternalExecution<TArgs, TResult>,
  ): void;

  cancelAll(reason?: unknown): void;
}
```

Implementations:

```text
DropScheduler
RestartScheduler
EnqueueScheduler
LatestScheduler
ParallelScheduler
```

Each scheduler should have isolated unit tests.

---

## 16.4 Operation adapters

Normalize Promise and Observable behavior.

```ts
interface OperationAdapter<TResult> {
  start(): void;
  cancel(reason?: unknown): void;
}
```

Implementations:

```text
PromiseOperationAdapter
ObservableOperationAdapter
```

Adapters should emit normalized lifecycle events to the execution state machine.

---

## 16.5 Angular facade

Responsibilities:

- Read-only signals
- Injection-context integration
- `DestroyRef`
- Directive adapters
- Optional `HttpClient` helpers
- Testing harness integration

Scheduling logic should not depend on Angular.

---

## 17. Repository Structure

Recommended monorepo layout:

```text
ng-task/
├── projects/
│   └── ng-task/
│       ├── src/
│       │   ├── public-api.ts
│       │   └── lib/
│       │       ├── core/
│       │       ├── schedulers/
│       │       ├── adapters/
│       │       ├── angular/
│       │       ├── directives/
│       │       └── testing/
│       ├── package.json
│       └── ng-package.json
├── integration/
│   ├── promise-demo/
│   ├── http-demo/
│   ├── observable-demo/
│   └── zoneless-demo/
├── docs/
├── scripts/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

Alternative package entry points:

```text
@your-scope/ng-task
@your-scope/ng-task/directives
@your-scope/ng-task/testing
@your-scope/ng-task/http
```

Only add `http` if it provides meaningful value.

---

## 18. Packaging Strategy

Use Angular library packaging conventions.

Package characteristics:

- ESM-first
- Side-effect free
- Strict TypeScript
- Partial Angular compilation
- Tree-shakable providers
- Secondary entry points
- No unnecessary runtime dependencies
- `rxjs` as peer dependency if Observable support is included
- Angular core as peer dependency
- Avoid depending on Angular Material or CDK in the core

Suggested peer dependencies:

```json
{
  "@angular/core": ">=20 <22",
  "rxjs": ">=7.8 <8"
}
```

Adjust exact ranges when publishing.

---

## 19. Testing Strategy

## 19.1 Unit tests

Test the pure core without TestBed.

Required scheduler cases:

### `drop`

- First execution starts
- Later execution is dropped
- Dropped handler is not invoked
- New execution can start after completion

### `restart`

- New execution supersedes active execution
- Abort signal is triggered
- Late result does not update task
- Latest execution wins

### `enqueue`

- FIFO ordering
- Queue count updates
- Cancellation of queued item
- Overflow policies
- Failure does not corrupt queue

### `latest`

- Intermediate queued executions become superseded
- Current execution is not cancelled
- Only newest queued item runs
- Queue count remains correct

### `parallel`

- Runs up to limit
- Additional executions queue
- Completion starts next queued execution
- Cancellation frees a slot
- Counts remain correct

---

## 19.2 State-machine tests

Test every valid transition.

Test invalid transitions such as:

```text
succeeded → running
dropped → failed
cancelled → succeeded
```

Late resolution tests are essential.

---

## 19.3 Promise adapter tests

- Resolve
- Reject
- Abort-aware handler
- Abort-ignorant handler
- Timeout
- Late completion
- Synchronous throw before Promise creation

---

## 19.4 Observable adapter tests

- Single emission and completion
- Multiple emissions
- Error
- Unsubscription
- Never-completing source
- Synchronous Observable error
- Late emissions after unsubscription
- Shared source behavior documentation

---

## 19.5 Angular integration tests

- Signals update templates
- Component destruction cancels execution
- Root service task can continue
- Zoneless fixture behavior
- Directive triggers task
- Disabled state and ARIA attributes
- Inputs update correctly

---

## 19.6 Test utilities

Secondary entry point:

```text
@your-scope/ng-task/testing
```

Proposed helpers:

```ts
createDeferred<T>()
createTaskTestClock()
createTaskHarness(task)
createControlledTaskHandler()
```

Harness example:

```ts
const harness = createTaskHarness(task);

const execution = task.run(input);

harness.resolve(execution.id, result);
harness.reject(execution.id, error);
harness.reportProgress(
  execution.id,
  { current: 50, total: 100 },
);
```

---

## 20. Documentation Plan

## 20.1 README structure

1. Package summary
2. Installation
3. Minimal example
4. Why tasks are different from resources
5. Concurrency policies
6. Cancellation semantics
7. Promise handlers
8. Observable handlers
9. Template usage
10. Timeouts
11. Progress
12. Lifecycle cleanup
13. Error handling
14. Testing
15. API reference
16. Limitations
17. Version compatibility
18. Comparison table

---

## 20.2 Required conceptual documentation

### “Task vs Resource”

Explain:

```text
Resource:
reactive value loading based on dependencies

Task:
imperative command triggered explicitly
```

### “Task vs RxJS flattening”

Explain:

```text
RxJS operators provide mechanics.
ng-task provides an Angular command model.
```

### “Cancellation is cooperative”

This must be prominent.

### “Dropped is not failed”

Dropped, cancelled, superseded, timed-out, and failed are different outcomes.

### “Do not auto-retry unsafe mutations”

Include idempotency examples.

---

## 20.3 Example applications

Create focused demos:

1. **Form submit**
   - `drop`
   - timeout
   - error state

2. **Search**
   - `restart`
   - stale-request cancellation

3. **Autosave**
   - `latest`

4. **Ordered writes**
   - `enqueue`

5. **File uploads**
   - bounded `parallel`
   - progress

6. **Zoneless application**
   - prove signal-based updates

7. **Observable HttpClient**
   - unsubscription behavior

---

## 21. Development Phases

## Phase 0: Validation and design

Deliverables:

- Final terminology
- Public API draft
- Status model
- Concurrency diagrams
- Cancellation contract
- README prototype
- Five scheduler behavior specifications

Exit criteria:

- API can express all core examples
- No ambiguity around dropped/superseded/cancelled
- `latest` behavior fully specified

---

## Phase 1: Pure TypeScript core

Implement:

- Execution IDs
- Execution state machine
- Task outcomes
- Scheduler interface
- `drop`
- `restart`
- `enqueue`
- `latest`
- `parallel`
- Promise adapter
- Fake clock
- Core unit tests

Exit criteria:

- No Angular dependency in core scheduling tests
- All race-condition tests pass
- Late results cannot mutate settled executions

---

## Phase 2: Angular Signals facade

Implement:

- `createTask()`
- Read-only signals
- Aggregate task state
- `DestroyRef` cleanup
- Zoneless support
- Basic examples

Exit criteria:

- Works in component and service contexts
- Destruction behavior is deterministic
- No `NgZone` dependency

---

## Phase 3: Observable support

Implement:

- Observable adapter
- Unsubscription cancellation
- Result policy
- HttpClient examples
- RxJS-focused tests

Exit criteria:

- Cancellation and completion semantics are documented
- Multiple-emission behavior is explicit

---

## Phase 4: Core production features

Implement:

- Timeout
- Manual retry
- Error classification
- Progress
- Queue overflow
- Pending delay
- Minimum pending duration

Exit criteria:

- All features have deterministic tests
- State remains race-safe under cancellation and timeout

---

## Phase 5: Template directives

Implement:

- `taskTrigger`
- `taskDisableWhilePending`
- `taskBusy`
- ARIA behavior
- Directive harnesses

Exit criteria:

- Core package remains usable without directives
- Accessibility behavior is documented

---

## Phase 6: Documentation and release candidate

Deliverables:

- Complete README
- API docs
- Examples
- Migration notes
- Benchmark results
- Bundle-size report
- Changelog
- Release checklist

Exit criteria:

- At least two real applications tested
- Public API reviewed for naming consistency
- No unresolved scheduler race conditions

---

## 22. Suggested MVP

The MVP should include:

1. `createTask()`
2. Promise handlers
3. Signals:
   - `pending`
   - `running`
   - `result`
   - `error`
   - `runningCount`
   - `queuedCount`
4. Execution handles
5. Outcomes
6. Concurrency:
   - `drop`
   - `restart`
   - `enqueue`
   - `latest`
   - bounded `parallel`
7. `AbortSignal`
8. Angular lifecycle cleanup
9. Timeout
10. Manual cancellation
11. Deterministic tests
12. Excellent concurrency documentation

Optional for MVP:

- Observable support

Defer from MVP:

- Automatic retry
- Template directives
- Aggregate progress
- DevTools
- Activity scopes
- Persistence
- Offline queues
- Router integration

---

## 23. Version Roadmap

## `0.1.0`

- Experimental API
- Promise handlers
- All concurrency policies
- Execution outcomes
- Cancellation
- Lifecycle cleanup
- Testing utilities

## `0.2.0`

- Observable support
- HttpClient examples
- Timeout
- Manual retry
- Error classification

## `0.3.0`

- Progress
- Pending UI timing
- Queue overflow policies
- Improved diagnostics

## `0.4.0`

- Template directives
- Accessibility helpers
- Angular test harnesses

## `0.5.0`

- Activity-scope adapter
- Async-boundary adapter
- Stable integration contracts

## `1.0.0`

Requirements:

- Public API stable
- Angular version matrix documented
- Real-world adoption feedback incorporated
- Race-condition test suite mature
- Migration policy published
- No known state corruption bugs
- Complete API and conceptual documentation

---

## 24. Diagnostics

Development-mode warnings should cover:

- Invalid state transitions
- Queue overflow
- Duplicate execution settlement
- Progress after settlement
- Result after cancellation
- Handler ignored cancellation and resolved late
- Task destroyed with active non-cancellable work
- Observable emitted after completion
- Retry requested with no previous execution
- Task configured with suspicious unsafe automatic retry

Potential diagnostic message:

```text
ng-task: Execution "save-profile:42" resolved after it was superseded.
The late value was ignored.
Ensure the handler observes TaskContext.signal when possible.
```

---

## 25. Performance Requirements

- Avoid recreating aggregate arrays on every minor progress update where possible.
- Keep scheduler operations near O(1), except queue scans where unavoidable.
- Avoid Angular TestBed in pure scheduling tests.
- Update signals only when values materially change.
- Avoid retaining completed execution objects indefinitely.
- Provide configurable history retention if history is added.
- Avoid heavy stack capture in production.
- Keep directives optional and tree-shakable.
- Target a small core bundle.

Suggested initial bundle target:

```text
Core compressed size: under 10 KB
```

Treat this as an engineering target, not a release blocker.

---

## 26. Execution Retention

Decide whether completed executions remain available.

Initial recommendation:

```ts
history: {
  limit: 1,
}
```

Keep only `lastExecution` by default.

Future option:

```ts
history: {
  limit: 20,
  retainFor: 60_000,
}
```

Do not retain arbitrary arguments indefinitely because they may:

- Consume memory
- Contain sensitive data
- Retain component references
- Retain large files

---

## 27. Security and Privacy

Document that task arguments may contain sensitive data.

Guidelines:

- Do not log arguments by default.
- Do not include arguments in error messages.
- Do not retain large execution history by default.
- Do not serialize task state.
- Treat idempotency keys as identifiers, not authentication secrets.
- Avoid exposing raw server errors directly to users.
- Do not automatically send diagnostics to external services.

---

## 28. Naming Decisions

Recommended names:

```text
createTask
Task
TaskExecution
TaskContext
TaskOutcome
TaskError
TaskProgress
```

Recommended concurrency values:

```text
drop
restart
enqueue
latest
parallel
```

Avoid mixing RxJS names directly into the main API:

```text
exhaust
switch
concat
merge
```

The behavioral names are easier for non-RxJS users.

Documentation can map them:

```text
drop     ≈ exhaustMap behavior
restart  ≈ switchMap behavior
enqueue  ≈ concatMap behavior
parallel ≈ mergeMap behavior
latest   = finish current, keep newest queued
```

---

## 29. Open Design Questions

Resolve these before `1.0.0`.

1. Should `createTask()` require an Angular injection context?
2. Should root-service tasks default to `allow` on destroy?
3. Should dropped executions receive unique IDs?
4. Should dropped executions increment `executionCount`?
5. Should cancellation immediately settle `done`, or wait for handler cleanup?
6. Should task-level `result` keep the last success after a later failure?
7. Should `reset()` cancel active work?
8. Should `retryLast()` retry the last failed execution only or any non-success outcome?
9. Should `latest` supersede queued executions immediately?
10. Should queued cancellation preserve queue order metadata?
11. What is the default Observable result policy?
12. Should errors from callbacks such as `onSuccess` affect task state?
13. Should task arguments be cloned, referenced, or configurable?
14. Should `pending` represent visual delay or raw execution state?
15. Should timeout be measured from creation or actual start for queued executions?
16. Should a queued execution time out while waiting?
17. Should parallel queue order always be FIFO?
18. How should task progress aggregate under multiple active executions?

Recommended early decisions:

- Timeout starts when execution begins, not while queued.
- `running` is raw state.
- `pending` is visual state when timing options are enabled.
- Queued executions receive IDs and count as executions.
- `latest` supersedes replaced queued executions immediately.
- Task `result` keeps the most recent successful result unless reset.
- `reset()` does not cancel by default; provide `cancelAndReset()` if needed.

---

## 30. Acceptance Criteria for Initial Public Release

The package is ready for an initial public release when:

- All five concurrency policies are implemented.
- Race-condition tests cover late resolve and late reject.
- Promise cancellation is documented and tested.
- Component destruction cleanup is tested.
- The public API is strictly typed.
- All public signals are read-only.
- No scheduler directly depends on Angular.
- The package works in a zoneless demo.
- The package builds with Angular library tooling.
- README includes one complete example for each concurrency policy.
- Bundle size is measured.
- CI runs tests, lint, build, API checks, and package validation.
- A packed tarball is installed into a separate sample application before publishing.

---

## 31. CI/CD Plan

Recommended CI jobs:

```text
lint
typecheck
unit-core
unit-angular
integration-zone
integration-zoneless
build-library
build-demos
bundle-size
package-tarball-test
api-report
```

Release flow:

1. Update version.
2. Generate changelog.
3. Build production package.
4. Run packed-tarball installation test.
5. Publish with provenance.
6. Create GitHub release.
7. Publish documentation.
8. Verify npm metadata.
9. Verify example installation command.
10. Announce release with concurrency examples.

---

## 32. Publishing Checklist

Before publishing:

- Package name availability checked
- Scope configured
- `license` set
- `repository` set
- `homepage` set
- `bugs` URL set
- `keywords` added
- Peer dependencies verified
- Angular compatibility tested
- Public API reviewed
- README copied into package output
- `sideEffects: false` verified
- Source maps checked
- Tarball contents inspected
- No private files included
- Package installed into a clean Angular app
- Zoneless demo works
- Observable demo works if included
- npm provenance enabled where possible

Suggested keywords:

```text
angular
signals
async
task
concurrency
cancellation
rxjs
zoneless
promise
observable
```

---

## 33. Recommended First Implementation Order

1. Define execution statuses and outcomes.
2. Build the execution state machine.
3. Build `DropScheduler`.
4. Build `RestartScheduler`.
5. Build `EnqueueScheduler`.
6. Build `LatestScheduler`.
7. Build `ParallelScheduler`.
8. Implement Promise adapter.
9. Build task aggregate state.
10. Add Angular Signals facade.
11. Add `DestroyRef`.
12. Add timeout.
13. Add manual cancellation.
14. Add deterministic fake clock.
15. Add examples and README.
16. Add Observable adapter.
17. Add directives only after API feedback.

---

## 34. Final Product Positioning

### Recommended npm description

> Signal-first controlled asynchronous actions for Angular with cancellation, lifecycle cleanup, and explicit concurrency policies.

### Recommended README headline

> Stop rewriting loading flags, cancellation, duplicate-submit prevention, and queue logic for every Angular action.

### Recommended package promise

```text
One task primitive for:
- drop duplicate actions
- restart stale actions
- queue ordered actions
- keep only the latest queued action
- limit parallel actions
```

### Core differentiator

The package should own this question:

> What should happen when this asynchronous action is invoked again before it finishes?

That explicit concurrency contract is the reason the package should exist.
