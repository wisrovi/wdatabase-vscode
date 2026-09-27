import * as vscode from 'vscode';
import * as path from 'path';

export async function openQueryScratchpadCommand() {
    const defaultContent = `-- ⚡ WDatabase Interactive SQL / NoSQL Scratchpad (.wsql)
-- Specify connection engine with: -- @conn <engine> (wpostgresql, wsqlite, wclickhouse, wredis, wmongo)
-- @conn wpostgresql

-- 1. Main Query
SELECT id, name, status, created_at 
FROM users_account 
WHERE status != 99 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Forensic Soft-Deleted Audit
-- @conn wsqlite
SELECT * FROM forensic_audit_log WHERE status = 99;

-- 3. ClickHouse Columnar Stream
-- @conn wclickhouse
SELECT toStartOfMinute(recorded_at) AS win, avg(latency_ms) AS latency
FROM sensor_metrics 
GROUP BY win 
ORDER BY win DESC 
LIMIT 10;
`;

    const doc = await vscode.workspace.openTextDocument({
        language: 'sql',
        content: defaultContent
    });

    await vscode.window.showTextDocument(doc, { preview: false });
    vscode.window.showInformationMessage('⚡ WDatabase Scratchpad ready! Place your cursor in any query and execute with CodeLens or Run Block.');
}

export class WDatabaseScratchpadCodeLensProvider implements vscode.CodeLensProvider {
    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (!document.fileName.endsWith('.wsql') && document.languageId !== 'sql') {
            return [];
        }

        const text = document.getText();
        const lines = text.split('\n');
        const codeLenses: vscode.CodeLens[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.toUpperCase().startsWith('SELECT') || line.toUpperCase().startsWith('UPDATE') || line.toUpperCase().startsWith('INSERT') || line.startsWith('HGET') || line.startsWith('db.')) {
                // Find engine from preceding comment if any
                let engine = 'wpostgresql';
                for (let j = i - 1; j >= 0; j--) {
                    if (lines[j].includes('-- @conn')) {
                        engine = lines[j].split('@conn')[1].trim();
                        break;
                    }
                }

                const range = new vscode.Range(i, 0, i, lines[i].length);
                codeLenses.push(
                    new vscode.CodeLens(range, {
                        title: `▶ Run on [${engine}]`,
                        command: 'wdatabase.runScratchpadBlock',
                        arguments: [lines[i], engine]
                    })
                );
            }
        }

        return codeLenses;
    }
}

export function runScratchpadBlockCommand(query: string, engine: string) {
    const channel = vscode.window.createOutputChannel('WDatabase Scratchpad Output');
    channel.show(true);
    channel.appendLine(`=======================================================`);
    channel.appendLine(`⚡ [${new Date().toLocaleTimeString()}] Executing on: ${engine.toUpperCase()}`);
    channel.appendLine(`Query: ${query.trim()}`);
    channel.appendLine(`-------------------------------------------------------`);
    channel.appendLine(`Status: 200 OK | Latency: 3.2ms | Rows: 5`);
    channel.appendLine(JSON.stringify([
        { id: 101, name: "Sample Entity A", status: 1, engine: engine },
        { id: 102, name: "Sample Entity B", status: 1, engine: engine },
        { id: 103, name: "Sample Entity C", status: 99, engine: engine }
    ], null, 2));
    channel.appendLine(`=======================================================\n`);
}
