import type { TaskProgress } from './types.js';

export interface TaskContext {
  readonly signal: AbortSignal;
  readonly executionId: string;
  readonly attempt: number;
  readonly idempotencyKey: string;

  reportProgress(progress: TaskProgress): void;
  throwIfCancelled(): void;
}
