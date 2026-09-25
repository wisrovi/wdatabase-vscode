import * as vscode from 'vscode';
import { WorkspaceIndex, BoundDBModel } from '../core/workspaceIndex';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly panel: vscode.WebviewPanel;

    private constructor(panel: vscode.WebviewPanel, private workspaceIndex: WorkspaceIndex) {
        this.panel = panel;
        this.update();
        this.panel.onDidDispose(() => this.dispose(), null);
    }

    public static createOrShow(workspaceIndex: WorkspaceIndex): void {
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'wdatabaseDashboard',
            'WDatabase Control Center & Data Inspector',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, workspaceIndex);
    }

    private update(): void {
        const models = this.workspaceIndex.getModels();
        this.panel.webview.html = this.getHtml(models);
    }

    private getHtml(models: BoundDBModel[]): string {
        const rows = models
            .map(
                (m) => `<tr>
            <td><strong>${m.className}</strong></td>
            <td><code>${m.tableName}</code></td>
            <td>${m.engines.map((e) => `<span class="tag">${e}</span>`).join(' ')}</td>
            <td>${m.isForensic ? '<span class="status soft-delete">Forensic (status=99)</span>' : '<span class="status standard">Standard</span>'}</td>
            <td>${m.fields.length} fields</td>
        </tr>`
            )
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WDatabase Control Center</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; padding: 2rem; }
        h1 { color: #00f2fe; }
        table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; background: #1e293b; border-radius: 8px; overflow: hidden; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #0f172a; color: #94a3b8; }
        .tag { background: #0284c7; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: white; }
        .status { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
        .status.soft-delete { background: #10b981; color: black; }
        .status.standard { background: #64748b; color: white; }
    </style>
</head>
<body>
    <h1>⚡ WDatabase Control Center & Data Inspector</h1>
    <p>Inspecting <strong>${models.length} Bound Database Models</strong> across your project workspace.</p>
    <table>
        <thead>
            <tr>
                <th>Pydantic Model</th>
                <th>Database Table</th>
                <th>Target Engine(s)</th>
                <th>Audit Mode</th>
                <th>Field Count</th>
            </tr>
        </thead>
        <tbody>
            ${rows || '<tr><td colspan="5">No database-bound Pydantic models detected yet.</td></tr>'}
        </tbody>
    </table>
</body>
</html>`;
    }

    private dispose(): void {
        DashboardPanel.currentPanel = undefined;
        this.panel.dispose();
    }
}
