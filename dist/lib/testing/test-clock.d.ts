export interface TaskTestClock {
    readonly now: number;
    tick(ms: number): Promise<void>;
    advanceBy(ms: number): Promise<void>;
}
export declare function createTaskTestClock(initialTime?: number): TaskTestClock;
//# sourceMappingURL=test-clock.d.ts.map