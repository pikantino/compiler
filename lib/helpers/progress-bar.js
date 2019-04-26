"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProgressBar = require("progress");
function createProgressBar(message, length = 1) {
    const progress = new ProgressBar(`${message} [:bar] :file`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });
    progress.render({ file: '' });
    return progress;
}
exports.createProgressBar = createProgressBar;
