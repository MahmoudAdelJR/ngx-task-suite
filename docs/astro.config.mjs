// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://MahmoudAdelJR.github.io',
  base: '/ngx-task-suite/',
  integrations: [
    starlight({
      title: 'ngx-task',
      description: 'Signal-first controlled asynchronous actions for Angular with explicit concurrency policies',
      logo: {
        src: './src/assets/logo.svg',
      },
      social: {
        github: 'https://github.com/MahmoudAdelJR/ngx-task-suite',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview & Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
          ],
        },
        {
          label: 'Concepts & Architecture',
          items: [
            { label: 'Architecture Overview', slug: 'concepts/architecture' },
            { label: 'Task vs Resource & RxJS', slug: 'concepts/task-vs-resource' },
          ],
        },
        {
          label: 'Core API Reference',
          items: [
            { label: 'createTask()', slug: 'api-reference/create-task' },
            { label: 'Task Signals', slug: 'api-reference/task-signals' },
            { label: 'TaskExecution Handle', slug: 'api-reference/task-execution' },
            { label: 'TaskContext', slug: 'api-reference/task-context' },
          ],
        },
        {
          label: 'Concurrency Policies',
          items: [
            { label: 'Policies Overview', slug: 'concurrency/overview' },
            { label: 'Drop Policy', slug: 'concurrency/drop' },
            { label: 'Restart Policy', slug: 'concurrency/restart' },
            { label: 'Enqueue Policy', slug: 'concurrency/enqueue' },
            { label: 'Latest Policy', slug: 'concurrency/latest' },
            { label: 'Parallel Policy', slug: 'concurrency/parallel' },
          ],
        },
        {
          label: 'Handlers & Adapters',
          items: [
            { label: 'Promise Handlers & AbortSignal', slug: 'handlers/promises' },
            { label: 'RxJS & HttpClient Handlers', slug: 'handlers/observables' },
          ],
        },
        {
          label: 'Production Features',
          items: [
            { label: 'Timeouts', slug: 'advanced/timeouts' },
            { label: 'Anti-Flicker Timing', slug: 'advanced/anti-flicker' },
            { label: 'Error Classification', slug: 'advanced/error-handling' },
            { label: 'Progress & Retries', slug: 'advanced/progress-retries' },
            { label: 'Lifecycle & DestroyRef', slug: 'advanced/lifecycle' },
          ],
        },
        {
          label: 'Template Directives',
          items: [
            { label: 'Directives Overview', slug: 'directives/overview' },
          ],
        },
        {
          label: 'Testing Utilities',
          items: [
            { label: 'Testing Overview', slug: 'testing/overview' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'Zoneless Angular', slug: 'advanced/zoneless' },
          ],
        },
      ],
    }),
  ],
});
