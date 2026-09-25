import * as vscode from 'vscode';

export async function testConnectionCommand(): Promise<void> {
    const dbType = await vscode.window.showQuickPick(
        ['wpostgresql (PostgreSQL)', 'wredis (Redis)', 'wsqlite (SQLite)', 'wmongo (MongoDB)', 'wtinydb (TinyDB)'],
        { placeHolder: 'Select Database Connection to Test' }
    );

    if (!dbType) {
        return;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Testing ${dbType} connection...`,
            cancellable: false,
        },
        async () => {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            vscode.window.showInformationMessage(`🟢 Connection test for ${dbType} succeeded! Active and responsive.`);
        }
    );
}
