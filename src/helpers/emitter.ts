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

export class Progress {
    private readonly width: number = 20;
    private readonly length: number;
    private readonly message: string;
    private readonly endMessage: string;
    private progress: number;
    private token: string;

    constructor(message: string, endMessage: string, length: number) {
        this.progress = 0;
        this.length = length;
        this.message = message;
        this.endMessage = endMessage;
    }

    public emit(message: string) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(message + '\n');
        this.print();
    }

    public render(token?: string): void {
        this.token = token;
        this.print();
    }

    public tick(token?: string): void {
        this.progress += 1;

        if (token !== void 0) {
            this.token = token;
        }

        this.print();
    }

    private print(): void {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);

        let bar: string = '';
        let secondPart: string = '';

        if (!this.length || this.length > this.progress) {
            secondPart = this.token || '';

            if (this.length) {
                bar = `[${this.bar()}] `;
            }
        } else {
            secondPart = this.endMessage + '\n';
        }

        process.stdout.write(this.message + ' ' + bar + secondPart);
    }

    private bar(): string {
        const fullness: number = Math.floor((this.progress / (this.length / this.width)));
        return Array(fullness).fill('=').concat(Array(this.width - fullness).fill(' ')).join('');
    }
}
