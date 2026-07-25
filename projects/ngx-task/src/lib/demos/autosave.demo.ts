import { Component } from '@angular/core';
import { createTask } from '../angular/create-task.js';

@Component({
  selector: 'app-autosave-demo',
  standalone: true,
  template: `
    <textarea (input)="onContentChange($event)"></textarea>
    <span>Status: {{ autosaveTask.status() }}</span>
  `,
})
export class AutosaveDemoComponent {
  readonly autosaveTask = createTask<string, { savedLength: number; time: number }>(
    async (text: string) => {
      await new Promise(resolve => setTimeout(resolve, 40));
      return { savedLength: text.length, time: Date.now() };
    },
    {
      concurrency: 'latest',
    },
  );

  onContentChange(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.autosaveTask.run(text);
  }
}
