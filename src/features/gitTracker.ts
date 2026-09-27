import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceIndex } from '../core/workspaceIndex';

export async function checkGitMigrationDriftCommand(workspaceIndex: WorkspaceIndex) {
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
    let modifiedFiles: string[] = [];

    try {
        const cp = require('child_process');
        const diffOut = cp.execSync(`git status --porcelain`, { cwd: workspaceFolder, encoding: 'utf8', timeout: 3000 });
        const lines = (diffOut || '').split('\n').filter((l: string) => l.trim().length > 0);
        modifiedFiles = lines.map((l: string) => l.substring(3).trim());
    } catch (e) {
        vscode.window.showInformationMessage('ℹ️ Git repository not found or clean in workspace.');
        return;
    }

    const modifiedModels = modifiedFiles.filter(f => f.endsWith('.py') && !f.includes('migrations/'));
    const migrationFiles = modifiedFiles.filter(f => f.includes('migrations/') || f.includes('alembic'));

    if (modifiedModels.length > 0 && migrationFiles.length === 0) {
        const item = await vscode.window.showWarningMessage(
            `⚠️ Git Schema Drift Alert: Python models modified (${modifiedModels.join(', ')}), but no migration script found in git staging!`,
            'Generate Migration Now',
            'Dismiss'
        );

        if (item === 'Generate Migration Now') {
            vscode.commands.executeCommand('wdatabase.generateMigration');
        }
    } else {
        vscode.window.showInformationMessage(`✅ Git Schema Tracker: Staging is clean. Migrations are properly synchronized with models.`);
    }
}
