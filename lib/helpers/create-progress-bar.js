"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProgressBar = require("progress");
function createProgressBar(length, message) {
    return new ProgressBar(`${message} [:bar] :token1 :token2`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });
}
exports.createProgressBar = createProgressBar;
