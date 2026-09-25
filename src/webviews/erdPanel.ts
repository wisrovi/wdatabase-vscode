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
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
        h1 { color: #00f2fe; margin-bottom: 0.5rem; }
        .badge { background: #1e293b; padding: 0.25rem 0.75rem; border-radius: 9999px; border: 1px solid #334155; }
        .mermaid { background: #1e293b; padding: 2rem; border-radius: 12px; margin-top: 1.5rem; }
    </style>
</head>
<body>
    <h1>🗄️ WDatabase Entity-Relationship Diagram (ERD)</h1>
    <p>Visualizing <span class="badge">${models.length} Bound DB Models</span> across workspace engines.</p>
    <div class="mermaid">
classDiagram
${mermaidNodes}
    </div>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;
    }

    private dispose(): void {
        ERDPanel.currentPanel = undefined;
        this.panel.dispose();
    }
}
