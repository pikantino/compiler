export declare class Emitter {
    private message;
    constructor(message: string);
    done(): void;
}
export declare class Progress {
    private readonly width;
    private readonly length;
    private readonly message;
    private readonly endMessage;
    private progress;
    private token;
    constructor(message: string, endMessage: string, length: number);
    emit(message: string): void;
    render(token?: string): void;
    tick(token?: string): void;
    private print;
    private bar;
}
