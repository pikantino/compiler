export function handleError<T>(error: NodeJS.ErrnoException, message: string, returningValue?: T): T | never {
    if (message) {
        error.message = message + '. ' + error.message;
    }
    if (returningValue !== void 0) {
        console.warn(error.toString());
        return returningValue;
    }
    throw error;
}
