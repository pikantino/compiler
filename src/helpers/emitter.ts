import * as readline from 'readline';

export class Emitter {
    constructor(private message: string) {
        process.stdout.write(message);
    }

    public done(): void {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(this.message + ' Done.\n');
    }
}
