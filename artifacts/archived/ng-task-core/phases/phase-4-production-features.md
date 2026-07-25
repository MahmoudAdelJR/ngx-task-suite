# Phase 4 Specification: Advanced Features (Timeouts, Retry, Progress, Anti-flicker)

## 🎯 Goal
Equip `ng-task` with production-grade execution management features including explicit timeouts, manual retries, error classification, progress reporting, queue overflow handling, and anti-flicker pending delay UI mechanics.

---

## 📦 Scope & Key Deliverables

1. **Timeout Support (`timeout`):**
   - Configurable numeric milliseconds or `TaskTimeoutOptions`.
   - Timer starts upon execution start (ignoring queue waiting time).
   - Aborts signal/unsubscribes, transitions execution status to `'timed-out'`, and returns normalized timeout error.

2. **Manual Retry & Context Identifiers (`retryLast()`):**
   - `task.retryLast()` triggers a fresh execution with identical arguments.
   - Incrementing `attempt` count passed in `TaskContext`.
   - Optional `idempotencyKey` attached to `TaskContext`.

3. **Normalized Error Model (`TaskError` & `classifyError`):**
   - Standardized error format: `kind` (`'application' | 'network' | 'timeout' | 'cancelled' | 'unknown'`), `message`, `retryable`, `statusCode`, `cause`.
   - `classifyError` custom hook configuration option.

4. **Progress Reporting (`TaskProgress`):**
   - `context.reportProgress({ current, total, unit, message })` API.
   - Expose `progress` signal on `TaskExecution` and `Task`.

5. **Queue Overflow Policies (`overflow`):**
   - Implement policies for queued schedulers (`Enqueue`, `Parallel`):
     - `'reject-newest'` (default): Drops incoming execution.
     - `'drop-oldest'`: Supersedes/drops oldest queued execution.
     - `'throw'`: Throws synchronous error on `run()`.

6. **Anti-Flicker Visual Timing (`pendingDelay`, `minimumPendingDuration`):**
   - `task.running()` updates immediately (raw truth).
   - `task.pending()` respects `pendingDelay` before showing loading UI and stays visible for `minimumPendingDuration` to prevent UI flickering.

---

## 🔍 Definition of Done (DoD)
- Timeouts trigger cancellation and distinct `'timed-out'` outcomes without corrupting task state.
- `pendingDelay` and `minimumPendingDuration` prevent micro-flashes on fast operations without altering execution truth (`running`).
- Queue overflow options are fully covered by unit tests.
