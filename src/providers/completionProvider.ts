import * as vscode from 'vscode';
import { DATABASE_PATTERNS } from '../core/catalog';

export class WDatabaseCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);

        if (!linePrefix.includes('w')) {
            return [];
        }

        const items: vscode.CompletionItem[] = [];

        DATABASE_PATTERNS.forEach((pat) => {
            const item = new vscode.CompletionItem(`wdb-${pat.name}`, vscode.CompletionItemKind.Snippet);
            item.detail = `[${pat.engine}] ${pat.title}`;
            item.documentation = new vscode.MarkdownString(`**${pat.description}**\n\n\`\`\`python\n${pat.snippet}\n\`\`\``);
            item.insertText = new vscode.SnippetString(pat.snippet);
            items.push(item);
        });

        return items;
    }
}
