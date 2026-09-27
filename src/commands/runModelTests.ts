import * as vscode from 'vscode';
import * as path from 'path';

export async function runModelTestsCommand(modelName?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!modelName && editor) {
        const text = editor.document.getText();
        const match = text.match(/class\s+([A-Za-z0-9_]+)\s*\((?:ForensicModel|BaseModel|ForensicDocument)\)/);
        if (match) {
            modelName = match[1];
        }
    }

    if (!modelName) {
        modelName = await vscode.window.showInputBox({
            prompt: 'Enter Model name to run pytest suite for:',
            placeHolder: 'e.g. Document, AnalyticsEvent'
        });
    }

    if (!modelName) {
        return;
    }

    const testFile = `tests/test_${modelName.toLowerCase()}_integration.py`;

    const terminal = vscode.window.createTerminal(`Pytest: ${modelName}`);
    terminal.show();
    terminal.sendText(`pytest -v ${testFile}`);
    vscode.window.showInformationMessage(`🧪 Executing pytest suite for ${modelName}...`);
}
