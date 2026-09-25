import * as vscode from 'vscode';
import { DATABASE_PATTERNS } from '../core/catalog';

export class CheatSheetPanel {
    public static currentPanel: CheatSheetPanel | undefined;

    public static createOrShow(): void {
        if (CheatSheetPanel.currentPanel) {
            CheatSheetPanel.currentPanel.panel.reveal(vscode.ViewColumn.Three);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'wdatabaseCheatSheet',
            'WDatabase Architect Patterns CheatSheet',
            vscode.ViewColumn.Three,
            { enableScripts: true }
        );

        CheatSheetPanel.currentPanel = new CheatSheetPanel(panel);
    }

    private constructor(private readonly panel: vscode.WebviewPanel) {
        this.panel.webview.html = this.getHtml();
        this.panel.onDidDispose(() => {
            CheatSheetPanel.currentPanel = undefined;
        });
    }

    private getHtml(): string {
        const cards = DATABASE_PATTERNS.map(
            (p) => `<div class="card">
            <h3>${p.title} <span class="badge">${p.engine}</span></h3>
            <p>${p.description}</p>
            <pre><code>${p.snippet}</code></pre>
        </div>`
        ).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WDatabase CheatSheet</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem; }
        h1 { color: #00f2fe; }
        .card { background: #1e293b; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
        .badge { background: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: white; float: right; }
        pre { background: #0f172a; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #38bdf8; font-family: monospace; }
    </style>
</head>
<body>
    <h1>📚 WDatabase Architect Patterns CheatSheet</h1>
    <p>Reference copyable code snippets for all 11 database libraries in the ecosystem.</p>
    ${cards}
</body>
</html>`;
    }
}
