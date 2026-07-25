# Phase 3 Specification: RxJS Observable Adapter & HttpClient Integration

## 🎯 Goal
Extend `ng-task` handler support to RxJS Observables, normalizing unsubscription cancellation, single vs multiple emissions, completion, and Angular `HttpClient` requests.

---

## 📦 Scope & Key Deliverables

1. **`ObservableOperationAdapter<TResult>`:**
   - Adapts `TaskHandler` returning `Observable<TResult>`.
   - Maps RxJS lifecycle events to `ExecutionStateMachine`:
     - `next` -> Update result signal / completion handling.
     - `complete` -> `succeeded`.
     - `error` -> `failed`.
     - `unsubscribe` -> `cancelled`.

2. **Observable Result Policies (`observableResult`):**
   - Implement result policy options: `'latest'` (default for v1) and `'first'`.
   - Support single-emission HTTP Observables cleanly.

3. **Cancellation Semantics:**
   - Unsubscribe immediately upon `execution.cancel()`, task superseding, or timeout.
   - Prevent late emissions from updating task signals post-unsubscription.

4. **HttpClient Integration & Testing:**
   - Verification tests with Angular `HttpClientTestingModule` / `HttpTestingController`.
   - Documentation for HTTP cancellation patterns.

---

## 🔍 Definition of Done (DoD)
- RxJS Observables (e.g., `HttpClient.get/post`) cancel via unsubscription when task is cancelled or superseded.
- Observable errors and completions correctly update task signals and resolve `done` outcome promises.
