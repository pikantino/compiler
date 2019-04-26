"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Progress = require("progress");
class Emitter {
    log(message) {
        if (this.progress) {
            this.progress.interrupt(message);
        }
        else {
            console.log(message);
        }
    }
    startProgress(message, endMessage, length = 1) {
        if (this.progress) {
            this.progress.terminate();
        }
        this.progress = new Progress(`${message} [:bar] :token1 :token2`, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            clear: true,
            total: length,
            callback: () => {
                this.progress = null;
                console.log(`${message} ${endMessage}`);
            }
        });
        this.progress.render({ token1: '', token2: '' });
    }
    complete() {
        if (this.progress) {
            this.progress.terminate();
        }
    }
    render(tokens) {
        if (this.progress) {
            this.progress.render(tokens);
        }
    }
    tick(tokens) {
        if (this.progress) {
            this.progress.tick(tokens);
        }
    }
}
exports.AppEmitter = new Emitter();
