import * as ProgressBar from 'progress';

export function createProgressBar(length: number, message: string): ProgressBar {
    return new ProgressBar(`${message} [:bar] :token1 :token2`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });
}
