"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function printDiagnostics(diagnostics) {
    diagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.warn(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.warn(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
        }
    });
}
exports.printDiagnostics = printDiagnostics;
