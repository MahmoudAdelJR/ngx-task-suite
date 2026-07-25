# Self-Clarification & Requirements Analysis (`plankit.clarify`)

> **Feature**: `astro-starlight-docs`  
> **Mode**: Autonomous execution (User requested full completion without interactive prompts)

---

## 🔍 Requirements Analysis & Decisions

### 1. Site Location & Scope
- **Decision**: Put the Astro Starlight site in `./docs` directory within the `ngx-task` workspace root.
- **Rationale**: Keeps the codebase clean, modular, and easy to run independently (`cd docs && npm run dev`) or via root workspace script (`npm run docs:dev`, `npm run docs:build`).

### 2. Documentation Architecture & Structure
We map the full technical guide (`DOCUMENTATION.md`) and package capabilities into structured, easy-to-navigate Starlight sections:
- **Home Page (`index.mdx`)**: Hero banner, feature highlights, installation snippet, quick code preview, badges.
- **Getting Started**: Introduction, Installation, Quick Start guide.
- **Concepts & Architecture**: Task vs Resource, Task vs RxJS Operators, State Machine lifecycle.
- **Core API**: `createTask`, `Task` signals interface, `TaskExecution` handle, `TaskContext`.
- **Concurrency Policies**: Detailed guides for `drop`, `restart`, `enqueue`, `latest`, `parallel` with interactive code tabs and conceptual visual flow explanations.
- **Handlers & Adapters**: Promise Async/Await (`AbortSignal`) and RxJS Observables (`HttpClient`, `destroyBehavior`).
- **Lifecycle & Scope**: `DestroyRef` automatic cleanup, custom injectors, `destroyBehavior`.
- **Production Features**: Timeouts, Anti-Flicker (`pendingDelay`, `minimumPendingDuration`), Error Classification, Progress Reporting, Retries.
- **Directives (`ngx-task/directives`)**: `taskTrigger`, `taskDisableWhilePending`, `taskBusy`.
- **Testing Utilities (`ngx-task/testing`)**: `createTaskHarness`, `createControlledTaskHandler`, `createDeferred`, `createTaskTestClock`.
- **Zoneless Angular**: Integrating `ngx-task` with `@angular/core` `provideExperimentalZonelessChangeDetection()`.

### 3. Styling & Branding
- Primary Accent: Modern Angular Vibrant Red / Cyber Indigo gradient (`#e0234e` to `#6366f1`).
- Theme: Dark-first modern glassmorphism with high contrast typography and clean code syntax highlighting.

### 4. Dependencies
- `@astrojs/starlight`: Standard Starlight documentation framework.
- `astro`: Base framework.
