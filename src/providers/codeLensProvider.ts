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

            // 3. WPipe Step Generator Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(rocket) [Generate WPipe Step]`,
                    command: 'wdatabase.generateWPipeStep',
                    arguments: [model.className],
                })
            );

            // 4. Mock Data Generator Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(sparkle) [Generate Seed Data]`,
                    command: 'wdatabase.generateMockData',
                    arguments: [model.className],
                })
            );

            // 5. Migration Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(diff) [Generate Migration]`,
                    command: 'wdatabase.generateMigration',
                    arguments: [model.className],
                })
            );

            // 6. Test Suite Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(beaker) [Generate Pytest Suite]`,
                    command: 'wdatabase.generateTestSuite',
                    arguments: [model.className],
                })
            );

            // 7. Query Playground Action
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: `$(terminal) [Query Playground]`,
                    command: 'wdatabase.openQueryPlayground',
                    arguments: [model],
                })
            );
        }

        return codeLenses;
    }
}
