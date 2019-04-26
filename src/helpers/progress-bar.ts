import * as ProgressBar from 'progress';

export function createProgressBar(message: string, length: number = 1): ProgressBar {
    const progress = new ProgressBar(`${message} [:bar] :file`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        clear: true,
        total: length,
        callback: () => console.log(`${message} Done.`)
    });

    progress.render({file: ''});

    return progress;
}
