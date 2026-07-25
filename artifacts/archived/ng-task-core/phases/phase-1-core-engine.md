# Phase 1 Specification: Pure TypeScript Core Engine & Schedulers

## 🎯 Goal
Implement the framework-independent pure TypeScript core scheduling engine, state machine, execution handles, task outcomes, operation adapters (Promise focus), and pure unit test suite.

---

## 📦 Scope & Key Deliverables

1. **Status Types & Outcome Models:**
   - `TaskExecutionStatus`: `'created' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'superseded' | 'dropped' | 'timed-out'`
   - `TaskStatus`: `'idle' | 'pending' | 'settled'`
   - `TaskOutcome<TResult>` tagged union (`success`, `failure`, `cancelled`, `superseded`, `dropped`, `timed-out`)

2. **Execution State Machine (`ExecutionStateMachine<TArgs, TResult>`):**
   - Pure state transition manager enforcing strict transition rules:
     - `created` → `queued` | `running` | `dropped`
     - `queued` → `running` | `cancelled` | `superseded`
     - `running` → `succeeded` | `failed` | `cancelled` | `superseded` | `timed-out`
   - Protection against late promise resolution/rejection mutations after settlement.

3. **Concurrency Schedulers (`TaskScheduler<TArgs, TResult>`):**
   - **`DropScheduler`**: Ignores new invocations while active.
   - **`RestartScheduler`**: Cancels/supersedes active execution and starts newest.
   - **`EnqueueScheduler`**: Runs executions sequentially in FIFO order with overflow handling.
   - **`LatestScheduler`**: Runs current execution, queues newest invocation while replacing intermediate queued items with `superseded`.
   - **`ParallelScheduler`**: Executes up to max concurrency limit, queueing remaining items.

4. **Promise Operation Adapter:**
   - Wraps handler functions returning `PromiseLike<TResult>`.
   - Generates per-execution `AbortController` and `TaskContext` (with `signal`, `executionId`, `attempt`, `idempotencyKey`).

5. **Testing Infrastructure:**
   - Pure TypeScript testing helpers: `createDeferred()`, `createTaskTestClock()`.
   - Comprehensive unit tests verifying race conditions, late resolution, cancellation, and state transitions without Angular/TestBed dependencies.

---

## 🔍 Definition of Done (DoD)
- All 5 concurrency policies pass unit tests with 100% boundary and race condition coverage.
- Pure core is 100% decoupled from `@angular/core` and `rxjs`.
- Zero late state mutation errors when handlers resolve after cancellation or superseding.
