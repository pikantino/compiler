"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function handleError(error, message, returningValue) {
    if (message) {
        error.message = message + '. ' + error.message;
    }
    if (returningValue !== void 0) {
        console.warn(error.toString());
        return returningValue;
    }
    throw error;
}
exports.handleError = handleError;
