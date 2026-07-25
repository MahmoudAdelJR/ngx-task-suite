import { Component } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { createTask } from '../angular/create-task.js';

@Component({
  selector: 'app-search-autocomplete-demo',
  standalone: true,
  template: `
    <input (input)="onSearch($event)" placeholder="Search..." />
    @if (searchTask.running()) { Loading suggestions... }
    <ul>
      @for (item of searchTask.result() || []; track item) {
        <li>{{ item }}</li>
      }
    </ul>
  `,
})
export class SearchAutocompleteDemoComponent {
  readonly searchTask = createTask(
    (query: string) => {
      return of([`${query} suggestion 1`, `${query} suggestion 2`]).pipe(
        delay(30),
      );
    },
    {
      concurrency: 'restart',
    },
  );

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTask.run(value);
  }
}
