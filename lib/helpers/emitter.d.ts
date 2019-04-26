declare class Emitter {
    private progress;
    log(message: string): void;
    startProgress(message: string, endMessage: string, length?: number): void;
    complete(): void;
    render(tokens?: {
        token1?: string;
        token2?: string;
    }): void;
    tick(tokens?: {
        token1?: string;
        token2?: string;
    }): void;
}
export declare const AppEmitter: Emitter;
export {};
