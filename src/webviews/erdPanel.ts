import * as vscode from 'vscode';
import { WorkspaceIndex, BoundDBModel } from '../core/workspaceIndex';

export class ERDPanel {
    public static currentPanel: ERDPanel | undefined;
    private readonly panel: vscode.WebviewPanel;

    private constructor(panel: vscode.WebviewPanel, private workspaceIndex: WorkspaceIndex) {
        this.panel = panel;
        this.update();
        this.panel.onDidDispose(() => this.dispose(), null);
    }

    public static createOrShow(extensionUri: vscode.Uri, workspaceIndex: WorkspaceIndex): void {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ERDPanel.currentPanel) {
            ERDPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'wdatabaseERD',
            'WDatabase Entity-Relationship Diagram (ERD)',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        ERDPanel.currentPanel = new ERDPanel(panel, workspaceIndex);
    }

    private update(): void {
        const models = this.workspaceIndex.getModels();
        this.panel.webview.html = this.getHtmlForWebview(models);
    }

    private getHtmlForWebview(models: BoundDBModel[]): string {
        const mermaidNodes = models
            .map((m) => {
                const fields = m.fields.map((f) => `    ${f.type} ${f.name}`).join('\n');
                return `  class ${m.className} {\n${fields}\n  }`;
            })
            .join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WDatabase ERD Visualizer</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        h1 { color: #00f2fe; margin: 0; }
        .badge { background: #1e293b; padding: 0.25rem 0.75rem; border-radius: 9999px; border: 1px solid #334155; }
        .actions { display: flex; gap: 10px; }
        button { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        button:hover { background: #0369a1; }
        .mermaid { background: #1e293b; padding: 2rem; border-radius: 12px; margin-top: 1rem; border: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🗄️ WDatabase Entity-Relationship Diagram (ERD)</h1>
            <p style="margin-top: 5px; color: #94a3b8;">Visualizing <span class="badge">${models.length} Bound DB Models</span> across workspace engines.</p>
        </div>
        <div class="actions">
            <button onclick="copyMermaid()">📋 Copy Mermaid Code</button>
            <button onclick="window.print()">🖨️ Export PDF / Print</button>
        </div>
    </div>

    <div class="mermaid" id="mermaidDiagram">
classDiagram
${mermaidNodes}
    </div>

    <script>
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });

        function copyMermaid() {
            const rawCode = \`classDiagram\\n${mermaidNodes.replace(/\\/g, '\\\\')}\`;
            navigator.clipboard.writeText(rawCode).then(() => {
                alert('✅ Mermaid ERD code copied to clipboard! Paste it into README.md or MkDocs.');
            });
        }
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        ERDPanel.currentPanel = undefined;
        this.panel.dispose();
    }
}
