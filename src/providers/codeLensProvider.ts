import * as vscode from 'vscode';
import { WorkspaceIndex } from '../core/workspaceIndex';

export class WDatabaseCodeLensProvider implements vscode.CodeLensProvider {
    constructor(private workspaceIndex: WorkspaceIndex) {}

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        if (document.languageId !== 'python') {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const models = this.workspaceIndex.getModels().filter((m) => m.filePath === document.uri.fsPath);

        for (const model of models) {
            const range = new vscode.Range(model.line, 0, model.line, 0);

            // 1. Inspect Schema Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(search) [WDatabase: ${model.engines.join('/')} Schema]`,
                    command: 'wdatabase.previewERD',
                    arguments: [model],
                })
            );

            // 2. Forensic Audit Badge & Action
            if (model.isForensic) {
                codeLenses.push(
                    new vscode.CodeLens(range, {
                        title: `$(shield) [ForensicModel Active: status=99 soft delete]`,
                        command: 'wdatabase.openDashboard',
                        arguments: [model],
                    })
                );
            }
        }

        return codeLenses;
    }
}
