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
class Progress {
    constructor(message, endMessage, length) {
        this.width = 20;
        this.progress = 0;
        this.length = length;
        this.message = message;
        this.endMessage = endMessage;
    }
    emit(message) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(message + '\n');
        this.print();
    }
    render(token) {
        this.token = token;
        this.print();
    }
    tick(token) {
        this.progress += 1;
        if (token !== void 0) {
            this.token = token;
        }
        this.print();
    }
    print() {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        let bar = '';
        let secondPart = '';
        if (!this.length || this.length > this.progress) {
            secondPart = this.token || '';
            if (this.length) {
                bar = `[${this.bar()}] `;
            }
        }
        else {
            secondPart = this.endMessage + '\n';
        }
        process.stdout.write(this.message + ' ' + bar + secondPart);
    }
    bar() {
        const fullness = Math.floor((this.progress / (this.length / this.width)));
        return Array(fullness).fill('=').concat(Array(this.width - fullness).fill(' ')).join('');
    }
}
exports.Progress = Progress;
