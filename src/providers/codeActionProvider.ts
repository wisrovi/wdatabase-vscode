import * as vscode from 'vscode';

export class WDatabaseCodeActionProvider implements vscode.CodeActionProvider {
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.code === 'ERR_UPDATE_DICT') {
                const fix = new vscode.CodeAction(
                    'Fix: Convert dict to Pydantic BaseModel instance for db.update()',
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                fix.isPreferred = true;
                actions.push(fix);
            }

            if (diagnostic.code === 'WARN_MISSING_PK') {
                const fix = new vscode.CodeAction(
                    "Fix: Add description='Primary Key' constraint to model field",
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                actions.push(fix);
            }

            if (diagnostic.code === 'WARN_HARDCODED_PWD_VAULT') {
                const fix = new vscode.CodeAction(
                    "Security Fix: Protect database password with WAuth encrypted vault (vault.get(...))",
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                fix.isPreferred = true;
                actions.push(fix);
            }

            if (diagnostic.code === 'ERR_CLICKHOUSE_LOOP_INSERT') {
                const fix = new vscode.CodeAction(
                    "Performance Fix: Refactor to db.insert_many(records) or db.insert_arrow()",
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                fix.isPreferred = true;
                actions.push(fix);
            }

            if (diagnostic.code === 'INFO_SQLITE_WAL') {
                const fix = new vscode.CodeAction(
                    'Optimization Fix: Enable wal_mode=True in WSQLite configuration',
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                actions.push(fix);
            }
        }

        return actions;
    }
}
