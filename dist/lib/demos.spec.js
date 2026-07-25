"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const form_submit_demo_js_1 = require("./demos/form-submit.demo.js");
const search_autocomplete_demo_js_1 = require("./demos/search-autocomplete.demo.js");
const autosave_demo_js_1 = require("./demos/autosave.demo.js");
const sequential_audit_log_demo_js_1 = require("./demos/sequential-audit-log.demo.js");
const batch_file_upload_demo_js_1 = require("./demos/batch-file-upload.demo.js");
const zoneless_demo_component_js_1 = require("./demos/zoneless-demo.component.js");
(0, vitest_1.describe)('Phase 6 Integration Demos Suite', () => {
    (0, vitest_1.it)('FormSubmitDemoComponent handles drop concurrency correctly', async () => {
        const comp = new form_submit_demo_js_1.FormSubmitDemoComponent();
        const exec1 = comp.saveTask.run({ title: 'First' });
        const exec2 = comp.saveTask.run({ title: 'Second' });
        (0, vitest_1.expect)(exec1.status()).toBe('running');
        (0, vitest_1.expect)(exec2.status()).toBe('dropped');
        const outcome1 = await exec1.done;
        (0, vitest_1.expect)(outcome1).toEqual({ type: 'success', value: { success: true, savedTitle: 'First' } });
    });
    (0, vitest_1.it)('SearchAutocompleteDemoComponent handles restart concurrency correctly', async () => {
        const comp = new search_autocomplete_demo_js_1.SearchAutocompleteDemoComponent();
        const exec1 = comp.searchTask.run('ang');
        const exec2 = comp.searchTask.run('angular');
        (0, vitest_1.expect)(exec1.status()).toBe('superseded');
        (0, vitest_1.expect)(exec2.status()).toBe('running');
        const outcome2 = await exec2.done;
        (0, vitest_1.expect)(outcome2.type).toBe('success');
        (0, vitest_1.expect)(comp.searchTask.result()).toEqual(['angular suggestion 1', 'angular suggestion 2']);
    });
    (0, vitest_1.it)('AutosaveDemoComponent handles latest concurrency correctly', async () => {
        const comp = new autosave_demo_js_1.AutosaveDemoComponent();
        const exec1 = comp.autosaveTask.run('version 1');
        const exec2 = comp.autosaveTask.run('version 2');
        const exec3 = comp.autosaveTask.run('version 3');
        (0, vitest_1.expect)(exec1.status()).toBe('running');
        (0, vitest_1.expect)(exec2.status()).toBe('superseded');
        (0, vitest_1.expect)(exec3.status()).toBe('queued');
        await exec1.done;
        const outcome3 = await exec3.done;
        (0, vitest_1.expect)(outcome3.type).toBe('success');
        (0, vitest_1.expect)(comp.autosaveTask.result()?.savedLength).toBe(9);
    });
    (0, vitest_1.it)('SequentialAuditLogDemoComponent handles enqueue concurrency correctly', async () => {
        const comp = new sequential_audit_log_demo_js_1.SequentialAuditLogDemoComponent();
        comp.logEvent('EVT_1');
        comp.logEvent('EVT_2');
        (0, vitest_1.expect)(comp.auditTask.runningCount()).toBe(1);
        (0, vitest_1.expect)(comp.auditTask.queuedCount()).toBe(1);
        await comp.auditTask.lastExecution()?.done;
    });
    (0, vitest_1.it)('BatchFileUploadDemoComponent handles bounded parallel concurrency', async () => {
        const comp = new batch_file_upload_demo_js_1.BatchFileUploadDemoComponent();
        comp.uploadFiles(['f1.txt', 'f2.txt', 'f3.txt', 'f4.txt']);
        (0, vitest_1.expect)(comp.uploadTask.runningCount()).toBe(3);
        (0, vitest_1.expect)(comp.uploadTask.queuedCount()).toBe(1);
        await comp.uploadTask.lastExecution()?.done;
    });
    (0, vitest_1.it)('ZonelessDemoComponent updates reactive signals cleanly', async () => {
        const comp = new zoneless_demo_component_js_1.ZonelessDemoComponent();
        const exec = comp.calculate.run(5);
        const outcome = await exec.done;
        (0, vitest_1.expect)(outcome).toEqual({ type: 'success', value: 50 });
        (0, vitest_1.expect)(comp.calculate.result()).toBe(50);
    });
});
//# sourceMappingURL=demos.spec.js.map