import { Component } from '@angular/core';
import { createTask } from '../angular/create-task.js';

@Component({
  selector: 'app-zoneless-demo',
  standalone: true,
  template: `
    <button (click)="calculate.run(42)">Calculate</button>
    @if (calculate.pending()) { Computing in Zoneless mode... }
    @if (calculate.result(); as val) {
      <p>Result: {{ val }}</p>
    }
  `,
})
export class ZonelessDemoComponent {
  readonly calculate = createTask(async (num: number) => {
    await new Promise(resolve => setTimeout(resolve, 30));
    return num * 10;
  });
}
