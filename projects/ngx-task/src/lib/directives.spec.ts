import { describe, it, expect } from 'vitest';
import { createTask } from './angular/create-task.js';
import { TaskTriggerDirective } from './directives/task-trigger.directive.js';
import { TaskDisableWhilePendingDirective } from './directives/task-disable-while-pending.directive.js';
import { TaskBusyDirective } from './directives/task-busy.directive.js';
import { createControlledTaskHandler, createTaskHarness } from './testing/harness.js';
import { createDeferred } from './testing/deferred.js';

describe('Phase 5 Template Directives & Test Harness Utilities', () => {
  describe('Directives Unit Logic', () => {
    it('triggers task execution on element click with taskArgs', () => {
      let executedArg: string | undefined;
      const task = createTask<string, string>(async (arg: string) => {
        executedArg = arg;
        return 'ok';
      });

      const directive = new TaskTriggerDirective<string, string>();
      directive.task = task;
      directive.taskArgs = 'click-payload';

      directive.onClick({ type: 'click' } as unknown as Event);

      expect(executedArg).toBe('click-payload');
      expect(task.executionCount()).toBe(1);
    });

    it('binds native disabled state when task is pending', () => {
      const deferred = createDeferred<void>();
      const task = createTask<void, void>(() => deferred.promise);

      const disableDirective = new TaskDisableWhilePendingDirective();
      disableDirective.explicitTask = task;
      disableDirective.taskDisableMode = 'native';

      expect(disableDirective.nativeDisabled).toBeNull();

      task.run(undefined);
      expect(disableDirective.nativeDisabled).toBe(true);

      deferred.resolve();
    });

    it('binds aria-disabled attribute when task is pending in aria mode', () => {
      const deferred = createDeferred<void>();
      const task = createTask<void, void>(() => deferred.promise);

      const disableDirective = new TaskDisableWhilePendingDirective();
      disableDirective.explicitTask = task;
      disableDirective.taskDisableMode = 'aria';

      expect(disableDirective.ariaDisabled).toBeNull();

      task.run(undefined);
      expect(disableDirective.ariaDisabled).toBe('true');

      deferred.resolve();
    });

    it('binds aria-busy and data-task-pending attributes on busy container', () => {
      const deferred = createDeferred<void>();
      const task = createTask<void, void>(() => deferred.promise);

      const busyDirective = new TaskBusyDirective();
      busyDirective.task = task;

      expect(busyDirective.ariaBusy).toBeNull();
      expect(busyDirective.dataPending).toBeNull();

      task.run(undefined);
      expect(busyDirective.ariaBusy).toBe('true');
      expect(busyDirective.dataPending).toBe('true');

      deferred.resolve();
    });
  });

  describe('Testing Harness Utilities', () => {
    it('controls execution resolution synchronously using createControlledTaskHandler', async () => {
      const controller = createControlledTaskHandler<string, number>();
      const task = createTask(controller.handler);

      const exec = task.run('item-1');
      expect(controller.invocations.length).toBe(1);
      expect(controller.invocations[0].args).toBe('item-1');
      expect(task.pending()).toBe(true);

      controller.resolveLast(999);
      const outcome = await exec.done;

      expect(outcome).toEqual({ type: 'success', value: 999 });
      expect(task.result()).toBe(999);
    });

    it('provides helper access via createTaskHarness', () => {
      const task = createTask<void, string>(async () => 'harness-res');
      const harness = createTaskHarness(task);

      expect(harness.lastExecution).toBeUndefined();
      const exec = task.run(undefined);

      expect(harness.lastExecution?.id).toBe(exec.id);
      harness.cancelLast('Cancelled via harness');
      expect(exec.status()).toBe('cancelled');
    });
  });
});
