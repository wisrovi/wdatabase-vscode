import * as vscode from 'vscode';
import { WorkspaceIndex, BoundDBModel } from '../core/workspaceIndex';

export class QueryPlaygroundPanel {
    public static currentPanel: QueryPlaygroundPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, private workspaceIndex: WorkspaceIndex, initialModel?: BoundDBModel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtmlForWebview(initialModel);
        
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'executeQuery':
                        await this._handleExecuteQuery(message.engine, message.query, message.modelName);
                        return;
                    case 'exportData':
                        await this._handleExportData(message.format, message.data);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(workspaceIndex: WorkspaceIndex, initialModel?: BoundDBModel) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (QueryPlaygroundPanel.currentPanel) {
            QueryPlaygroundPanel.currentPanel._panel.reveal(column);
            if (initialModel) {
                QueryPlaygroundPanel.currentPanel._updateModel(initialModel);
            }
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'wdatabaseQueryPlayground',
            '⚡ WDatabase Query & NoSQL Playground',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        QueryPlaygroundPanel.currentPanel = new QueryPlaygroundPanel(panel, workspaceIndex, initialModel);
    }

    private _updateModel(model: BoundDBModel) {
        this._panel.webview.postMessage({ command: 'setModel', model });
    }

    private async _handleExecuteQuery(engine: string, query: string, modelName: string) {
        // Simulated execution return structure for DB query execution
        const sampleResults = [
            { id: 1, name: "Sample Record 1", status: 1, created_at: "2026-09-25T12:00:00Z", forensic_version: 1 },
            { id: 2, name: "Sample Record 2", status: 1, created_at: "2026-09-25T13:30:00Z", forensic_version: 1 },
            { id: 3, name: "Deleted Record", status: 99, created_at: "2026-09-25T14:00:00Z", forensic_version: 2 }
        ];

        this._panel.webview.postMessage({
            command: 'queryResult',
            results: sampleResults,
            executionTimeMs: Math.floor(Math.random() * 25) + 5,
            rowCount: sampleResults.length
        });
    }

    private async _handleExportData(format: 'json' | 'csv', data: any[]) {
        const fileUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`query_export.${format}`),
            filters: format === 'json' ? { 'JSON Files': ['json'] } : { 'CSV Files': ['csv'] }
        });

        if (!fileUri) {
            return;
        }

        let content = '';
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
        } else {
            if (data.length > 0) {
                const keys = Object.keys(data[0]);
                const header = keys.join(',');
                const rows = data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
                content = [header, ...rows].join('\n');
            }
        }

        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage(`✅ Exported ${data.length} records to ${fileUri.fsPath}`);
    }

    public dispose() {
        QueryPlaygroundPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(initialModel?: BoundDBModel): string {
        const models = this.workspaceIndex.getModels();
        const modelOptionsHtml = models.map(m => `<option value="${m.className}" data-engine="${m.engines.join(',')}">${m.className} (${m.engines.join(', ')})</option>`).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WDatabase Query Playground</title>
    <style>
        body { font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 15px; }
        .controls { display: flex; gap: 10px; margin-bottom: 15px; align-items: center; flex-wrap: wrap; }
        select, input, button, textarea { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px 12px; border-radius: 4px; font-family: inherit; }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; border: none; font-weight: bold; }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .editor-container { margin-bottom: 15px; }
        textarea { width: 100%; height: 120px; font-family: monospace; box-sizing: border-box; resize: vertical; }
        .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid var(--vscode-widget-border); padding: 8px; text-align: left; font-size: 13px; }
        th { background: var(--vscode-editor-lineHighlightBackground); }
        .badge { background: #007acc; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
        .badge-forensic { background: #e67e22; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <h2>⚡ WDatabase Interactive Query & NoSQL Playground</h2>
    <div class="controls">
        <label>Model: </label>
        <select id="modelSelect" onchange="onModelChange()">
            <option value="">-- Select Target Model --</option>
            ${modelOptionsHtml}
        </select>
        
        <label>Engine: </label>
        <select id="engineSelect">
            <option value="wpostgresql">wpostgresql (SQL)</option>
            <option value="wsqlite">wsqlite (SQL)</option>
            <option value="wredis">wredis (Key-Value)</option>
            <option value="wtinydb">wtinydb (Document)</option>
            <option value="wmongo">wmongo (BSON)</option>
        </select>

        <button onclick="runQuery()">▶ Execute Query</button>
    </div>

    <div class="editor-container">
        <textarea id="queryInput" placeholder="Enter query expression (e.g. SELECT * FROM document WHERE status != 99; OR db.get_all())">SELECT * FROM document WHERE status != 99;</textarea>
    </div>

    <div class="results-header">
        <span id="statusText">Ready to execute query.</span>
        <div>
            <button onclick="exportData('json')">📥 Export JSON</button>
            <button onclick="exportData('csv')">📥 Export CSV</button>
        </div>
    </div>

    <div id="resultsTableContainer">
        <p style="color: var(--vscode-descriptionForeground)">No query executed yet.</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let lastResults = [];

        function onModelChange() {
            const select = document.getElementById('modelSelect');
            const selectedOpt = select.options[select.selectedIndex];
            if (selectedOpt && selectedOpt.dataset.engine) {
                const engines = selectedOpt.dataset.engine.split(',');
                if (engines.length > 0) {
                    document.getElementById('engineSelect').value = engines[0];
                }
            }
        }

        function runQuery() {
            const modelName = document.getElementById('modelSelect').value;
            const engine = document.getElementById('engineSelect').value;
            const query = document.getElementById('queryInput').value;

            document.getElementById('statusText').innerText = 'Executing query...';
            vscode.postMessage({
                command: 'executeQuery',
                modelName,
                engine,
                query
            });
        }

        function exportData(format) {
            if (!lastResults || lastResults.length === 0) {
                alert('No data available to export.');
                return;
            }
            vscode.postMessage({
                command: 'exportData',
                format,
                data: lastResults
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'queryResult') {
                lastResults = message.results;
                document.getElementById('statusText').innerHTML = 'Query finished in <b>' + message.executionTimeMs + ' ms</b> (' + message.rowCount + ' rows)';
                
                if (!message.results || message.results.length === 0) {
                    document.getElementById('resultsTableContainer').innerHTML = '<p>No records returned.</p>';
                    return;
                }

                const cols = Object.keys(message.results[0]);
                let html = '<table><thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
                
                message.results.forEach(row => {
                    html += '<tr>' + cols.map(c => {
                        let val = row[c];
                        if (c === 'status' && val === 99) {
                            return '<td><span class="badge-forensic">99 (Soft Deleted)</span></td>';
                        }
                        return '<td>' + (typeof val === 'object' ? JSON.stringify(val) : val) + '</td>';
                    }).join('') + '</tr>';
                });
                
                html += '</tbody></table>';
                document.getElementById('resultsTableContainer').innerHTML = html;
            }
        });
    </script>
</body>
</html>`;
    }
}
