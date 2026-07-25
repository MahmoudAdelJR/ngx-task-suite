"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskTestClock = createTaskTestClock;
function createTaskTestClock(initialTime = 0) {
    let currentTime = initialTime;
    return {
        get now() {
            return currentTime;
        },
        async tick(ms) {
            currentTime += ms;
            await new Promise(resolve => setTimeout(resolve, 0));
        },
        async advanceBy(ms) {
            currentTime += ms;
            await new Promise(resolve => setTimeout(resolve, 0));
        },
    };
}
//# sourceMappingURL=test-clock.js.map