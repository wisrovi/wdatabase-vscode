import * as vscode from 'vscode';

export async function launchConnectionWizard(): Promise<void> {
    const host = await vscode.window.showInputBox({ prompt: 'Database Host', value: 'localhost' });
    if (!host) {
        return;
    }

    const port = await vscode.window.showInputBox({ prompt: 'Database Port', value: '5432' });
    if (!port) {
        return;
    }

    const dbname = await vscode.window.showInputBox({ prompt: 'Database Name', value: 'wpostgresql' });
    if (!dbname) {
        return;
    }

    const configCode = `import os\n\ndb_config = {\n    "dbname": "${dbname}",\n    "user": "postgres",\n    "password": os.getenv("DB_PASSWORD", "postgres"),\n    "host": "${host}",\n    "port": ${port},\n}\n`;

    const doc = await vscode.workspace.openTextDocument({
        content: configCode,
        language: 'python',
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('✨ Connection configuration generated safely with environment variable support.');
}
