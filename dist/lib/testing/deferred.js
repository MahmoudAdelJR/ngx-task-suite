"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeferred = createDeferred;
function createDeferred() {
    let resolve;
    let reject;
    let isSettled = false;
    const promise = new Promise((res, rej) => {
        resolve = (val) => {
            isSettled = true;
            res(val);
        };
        reject = (reason) => {
            isSettled = true;
            rej(reason);
        };
    });
    return {
        promise,
        resolve,
        reject,
        get isSettled() {
            return isSettled;
        },
    };
}
//# sourceMappingURL=deferred.js.map