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
                    "Fix: Add description='Primary Key' constraint to field",
                    vscode.CodeActionKind.QuickFix
                );
                fix.diagnostics = [diagnostic];
                actions.push(fix);
            }
        }

        return actions;
    }
}
