import type { TaskError } from './types.js';

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
