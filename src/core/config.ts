import * as vscode from 'vscode';

export interface ExtensionConfig {
    excludePaths: string[];
    enableForensicBadges: boolean;
}

export function getExtensionConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('wdatabase');
    return {
        excludePaths: config.get<string[]>('excludePaths', ['**/node_modules/**', '**/.venv/**', '**/venv/**']),
        enableForensicBadges: config.get<boolean>('enableForensicBadges', true),
    };
}
