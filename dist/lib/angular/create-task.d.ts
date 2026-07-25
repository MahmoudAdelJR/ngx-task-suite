import type { Task, TaskHandler, CreateTaskOptions } from './task.interface.js';
export declare function createTask<TArgs, TResult>(handler: TaskHandler<TArgs, TResult>, options?: CreateTaskOptions<TArgs, TResult>): Task<TArgs, TResult>;
//# sourceMappingURL=create-task.d.ts.map