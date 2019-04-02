"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
class Emitter {
    constructor(message) {
        this.message = message;
        process.stdout.write(message);
    }
    done() {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(this.message + ' Done.\n');
    }
}
exports.Emitter = Emitter;
