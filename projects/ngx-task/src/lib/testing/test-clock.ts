export interface TaskTestClock {
  readonly now: number;
  tick(ms: number): Promise<void>;
  advanceBy(ms: number): Promise<void>;
}

export function createTaskTestClock(initialTime: number = 0): TaskTestClock {
  let currentTime = initialTime;

  return {
    get now() {
      return currentTime;
    },
    async tick(ms: number): Promise<void> {
      currentTime += ms;
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    async advanceBy(ms: number): Promise<void> {
      currentTime += ms;
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  };
}
