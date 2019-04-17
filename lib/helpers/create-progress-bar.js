"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProgressBar = require("progress");
function createProgressBar(length, message) {
    const progress = new ProgressBar(`${message} [:bar] :token1`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });
    progress.render({ token1: '', token2: '' });
    return progress;
}
exports.createProgressBar = createProgressBar;
