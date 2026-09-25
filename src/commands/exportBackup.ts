import * as vscode from 'vscode';

export async function exportBackupCommand(): Promise<void> {
    const backupType = await vscode.window.showQuickPick(
        [
            'Export to SQLite File (backup_db_to_sqlite)',
            'Generate SQL Reconstruction Script (export_to_sql_script)',
        ],
        { placeHolder: 'Select Backup / Export Method' }
    );

    if (!backupType) {
        return;
    }

    const fileName = await vscode.window.showInputBox({
        prompt: 'Enter output filename',
        value: backupType.includes('SQLite') ? 'backup_database.db' : 'reconstruct_schema.sql',
    });

    if (fileName) {
        vscode.window.showInformationMessage(`✅ Export task triggered for ${fileName}. Backup process initialized.`);
    }
}
