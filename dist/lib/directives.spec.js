"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const create_task_js_1 = require("./angular/create-task.js");
const task_trigger_directive_js_1 = require("./directives/task-trigger.directive.js");
const task_disable_while_pending_directive_js_1 = require("./directives/task-disable-while-pending.directive.js");
const task_busy_directive_js_1 = require("./directives/task-busy.directive.js");
const harness_js_1 = require("./testing/harness.js");
const deferred_js_1 = require("./testing/deferred.js");
(0, vitest_1.describe)('Phase 5 Template Directives & Test Harness Utilities', () => {
    (0, vitest_1.describe)('Directives Unit Logic', () => {
        (0, vitest_1.it)('triggers task execution on element click with taskArgs', () => {
            let executedArg;
            const task = (0, create_task_js_1.createTask)(async (arg) => {
                executedArg = arg;
                return 'ok';
            });
            const directive = new task_trigger_directive_js_1.TaskTriggerDirective();
            directive.task = task;
            directive.taskArgs = 'click-payload';
            directive.onClick({ type: 'click' });
            (0, vitest_1.expect)(executedArg).toBe('click-payload');
            (0, vitest_1.expect)(task.executionCount()).toBe(1);
        });
        (0, vitest_1.it)('binds native disabled state when task is pending', () => {
            const deferred = (0, deferred_js_1.createDeferred)();
            const task = (0, create_task_js_1.createTask)(() => deferred.promise);
            const disableDirective = new task_disable_while_pending_directive_js_1.TaskDisableWhilePendingDirective();
            disableDirective.explicitTask = task;
            disableDirective.taskDisableMode = 'native';
            (0, vitest_1.expect)(disableDirective.nativeDisabled).toBeNull();
            task.run(undefined);
            (0, vitest_1.expect)(disableDirective.nativeDisabled).toBe(true);
            deferred.resolve();
        });
        (0, vitest_1.it)('binds aria-disabled attribute when task is pending in aria mode', () => {
            const deferred = (0, deferred_js_1.createDeferred)();
            const task = (0, create_task_js_1.createTask)(() => deferred.promise);
            const disableDirective = new task_disable_while_pending_directive_js_1.TaskDisableWhilePendingDirective();
            disableDirective.explicitTask = task;
            disableDirective.taskDisableMode = 'aria';
            (0, vitest_1.expect)(disableDirective.ariaDisabled).toBeNull();
            task.run(undefined);
            (0, vitest_1.expect)(disableDirective.ariaDisabled).toBe('true');
            deferred.resolve();
        });
        (0, vitest_1.it)('binds aria-busy and data-task-pending attributes on busy container', () => {
            const deferred = (0, deferred_js_1.createDeferred)();
            const task = (0, create_task_js_1.createTask)(() => deferred.promise);
            const busyDirective = new task_busy_directive_js_1.TaskBusyDirective();
            busyDirective.task = task;
            (0, vitest_1.expect)(busyDirective.ariaBusy).toBeNull();
            (0, vitest_1.expect)(busyDirective.dataPending).toBeNull();
            task.run(undefined);
            (0, vitest_1.expect)(busyDirective.ariaBusy).toBe('true');
            (0, vitest_1.expect)(busyDirective.dataPending).toBe('true');
            deferred.resolve();
        });
    });
    (0, vitest_1.describe)('Testing Harness Utilities', () => {
        (0, vitest_1.it)('controls execution resolution synchronously using createControlledTaskHandler', async () => {
            const controller = (0, harness_js_1.createControlledTaskHandler)();
            const task = (0, create_task_js_1.createTask)(controller.handler);
            const exec = task.run('item-1');
            (0, vitest_1.expect)(controller.invocations.length).toBe(1);
            (0, vitest_1.expect)(controller.invocations[0].args).toBe('item-1');
            (0, vitest_1.expect)(task.pending()).toBe(true);
            controller.resolveLast(999);
            const outcome = await exec.done;
            (0, vitest_1.expect)(outcome).toEqual({ type: 'success', value: 999 });
            (0, vitest_1.expect)(task.result()).toBe(999);
        });
        (0, vitest_1.it)('provides helper access via createTaskHarness', () => {
            const task = (0, create_task_js_1.createTask)(async () => 'harness-res');
            const harness = (0, harness_js_1.createTaskHarness)(task);
            (0, vitest_1.expect)(harness.lastExecution).toBeUndefined();
            const exec = task.run(undefined);
            (0, vitest_1.expect)(harness.lastExecution?.id).toBe(exec.id);
            harness.cancelLast('Cancelled via harness');
            (0, vitest_1.expect)(exec.status()).toBe('cancelled');
        });
    });
});
//# sourceMappingURL=directives.spec.js.map