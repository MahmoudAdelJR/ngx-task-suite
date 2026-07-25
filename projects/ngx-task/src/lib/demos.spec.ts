import { describe, it, expect } from 'vitest';
import { FormSubmitDemoComponent } from './demos/form-submit.demo.js';
import { SearchAutocompleteDemoComponent } from './demos/search-autocomplete.demo.js';
import { AutosaveDemoComponent } from './demos/autosave.demo.js';
import { SequentialAuditLogDemoComponent } from './demos/sequential-audit-log.demo.js';
import { BatchFileUploadDemoComponent } from './demos/batch-file-upload.demo.js';
import { ZonelessDemoComponent } from './demos/zoneless-demo.component.js';

describe('Phase 6 Integration Demos Suite', () => {
  it('FormSubmitDemoComponent handles drop concurrency correctly', async () => {
    const comp = new FormSubmitDemoComponent();
    const exec1 = comp.saveTask.run({ title: 'First' });
    const exec2 = comp.saveTask.run({ title: 'Second' });

    expect(exec1.status()).toBe('running');
    expect(exec2.status()).toBe('dropped');

    const outcome1 = await exec1.done;
    expect(outcome1).toEqual({ type: 'success', value: { success: true, savedTitle: 'First' } });
  });

  it('SearchAutocompleteDemoComponent handles restart concurrency correctly', async () => {
    const comp = new SearchAutocompleteDemoComponent();
    const exec1 = comp.searchTask.run('ang');
    const exec2 = comp.searchTask.run('angular');

    expect(exec1.status()).toBe('superseded');
    expect(exec2.status()).toBe('running');

    const outcome2 = await exec2.done;
    expect(outcome2.type).toBe('success');
    expect(comp.searchTask.result()).toEqual(['angular suggestion 1', 'angular suggestion 2']);
  });

  it('AutosaveDemoComponent handles latest concurrency correctly', async () => {
    const comp = new AutosaveDemoComponent();
    const exec1 = comp.autosaveTask.run('version 1');
    const exec2 = comp.autosaveTask.run('version 2');
    const exec3 = comp.autosaveTask.run('version 3');

    expect(exec1.status()).toBe('running');
    expect(exec2.status()).toBe('superseded');
    expect(exec3.status()).toBe('queued');

    await exec1.done;
    const outcome3 = await exec3.done;
    expect(outcome3.type).toBe('success');
    expect(comp.autosaveTask.result()?.savedLength).toBe(9);
  });

  it('SequentialAuditLogDemoComponent handles enqueue concurrency correctly', async () => {
    const comp = new SequentialAuditLogDemoComponent();
    comp.logEvent('EVT_1');
    comp.logEvent('EVT_2');

    expect(comp.auditTask.runningCount()).toBe(1);
    expect(comp.auditTask.queuedCount()).toBe(1);

    await comp.auditTask.lastExecution()?.done;
  });

  it('BatchFileUploadDemoComponent handles bounded parallel concurrency', async () => {
    const comp = new BatchFileUploadDemoComponent();
    comp.uploadFiles(['f1.txt', 'f2.txt', 'f3.txt', 'f4.txt']);

    expect(comp.uploadTask.runningCount()).toBe(3);
    expect(comp.uploadTask.queuedCount()).toBe(1);

    await comp.uploadTask.lastExecution()?.done;
  });

  it('ZonelessDemoComponent updates reactive signals cleanly', async () => {
    const comp = new ZonelessDemoComponent();
    const exec = comp.calculate.run(5);
    const outcome = await exec.done;

    expect(outcome).toEqual({ type: 'success', value: 50 });
    expect(comp.calculate.result()).toBe(50);
  });
});
