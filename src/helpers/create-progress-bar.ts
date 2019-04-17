import * as ProgressBar from 'progress';

export function createProgressBar(length: number, message: string): ProgressBar {
    const progress = new ProgressBar(`${message} [:bar] :token1`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });

    progress.render({token1: '', token2: ''});

    return progress;
}
