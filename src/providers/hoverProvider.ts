import * as vscode from 'vscode';
import { WorkspaceIndex } from '../core/workspaceIndex';

export class WDatabaseHoverProvider implements vscode.HoverProvider {
    constructor(private workspaceIndex: WorkspaceIndex) {}

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        const models = this.workspaceIndex.getModels();
        const targetModel = models.find((m) => m.className === word);

        if (!targetModel) {
            return null;
        }

        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`### 🗄️ WDatabase Model: **${targetModel.className}**\n\n`);
        markdown.appendMarkdown(`* **Engines**: \`${targetModel.engines.join(', ')}\`\n`);
        markdown.appendMarkdown(`* **Table Name**: \`${targetModel.tableName}\`\n`);
        markdown.appendMarkdown(`* **Base Class**: \`${targetModel.baseClass}\`\n`);
        markdown.appendMarkdown(`* **Forensic Audit**: \`${targetModel.isForensic ? 'Enabled (status=99 soft delete)' : 'Disabled'}\`\n\n`);

        markdown.appendMarkdown(`#### Schema Columns:\n`);
        markdown.appendMarkdown(`| Field | Type | Constraints |\n`);
        markdown.appendMarkdown(`|---|---|---|\n`);

        for (const field of targetModel.fields) {
            const constraints = [
                field.isPrimaryKey ? '`PRIMARY KEY`' : '',
                field.isNotNull ? '`NOT NULL`' : '',
                field.isUnique ? '`UNIQUE`' : '',
            ]
                .filter(Boolean)
                .join(', ');

            markdown.appendMarkdown(`| \`${field.name}\` | \`${field.type}\` | ${constraints || '-'} |\n`);
        }

        return new vscode.Hover(markdown);
    }
}
