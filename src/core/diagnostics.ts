import * as vscode from 'vscode';

export class WDatabaseDiagnostics {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('wdatabase');
    }

    public getCollection(): vscode.DiagnosticCollection {
        return this.diagnosticCollection;
    }

    public analyzeDocument(document: vscode.TextDocument): void {
        if (document.languageId !== 'python') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 1. Check if passing dict to db.update() instead of BaseModel instance
            if (line.includes('.update(') && line.includes('{')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'WDatabase Anti-Pattern: db.update() requires a Pydantic BaseModel instance, NOT a dict.',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'ERR_UPDATE_DICT';
                diagnostics.push(diagnostic);
            }

            // 2. Check for missing Primary Key on models
            if (line.match(/^class\s+([A-Za-z0-9_]+)\s*\(\s*(ForensicModel|BaseModel)\s*\)\s*:/)) {
                let hasPK = false;
                for (let j = i + 1; j < lines.length && (lines[j].startsWith(' ') || lines[j].trim() === ''); j++) {
                    if (lines[j].toLowerCase().includes('primary key') || lines[j].toLowerCase().includes('primary')) {
                        hasPK = true;
                        break;
                    }
                }
                if (!hasPK) {
                    const range = new vscode.Range(i, 0, i, line.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        "WDatabase Warning: Model definition missing 'Primary Key' description field.",
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.code = 'WARN_MISSING_PK';
                    diagnostics.push(diagnostic);
                }
            }

            // 3. Check for hardcoded plain text passwords in db_config -> Suggest WAuth Vault
            if (line.includes('"password":') && !line.includes('os.getenv') && !line.includes('os.environ') && !line.includes('vault.get')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'WDatabase Security Alert: Hardcoded database password detected. Store and retrieve it via WAuth vault or os.getenv().',
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.code = 'WARN_HARDCODED_PWD_VAULT';
                diagnostics.push(diagnostic);
            }

            // 4. OLAP Anti-Pattern: ClickHouse loop insertion check
            if ((line.includes('db.insert(') || line.includes('.insert(')) && i > 0) {
                const prevLine = lines[i - 1];
                if (prevLine.trim().startsWith('for ') && (text.includes('WClickHouse') || text.includes('wclickhouse'))) {
                    const range = new vscode.Range(i - 1, 0, i, line.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        'WClickHouse Performance Anti-Pattern: Single-row loop insertion on OLAP database. Use db.insert_many() or db.insert_arrow() for columnar speed.',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.code = 'ERR_CLICKHOUSE_LOOP_INSERT';
                    diagnostics.push(diagnostic);
                }
            }

            // 5. Redis Anti-Pattern: KEYS * in production code
            if (line.includes('.keys("*') || line.includes(".keys('*") || line.includes("keys('*')") || line.includes('keys("*")')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'WRedis Cluster Anti-Pattern: Calling keys("*") blocks Redis single-threaded event loop. Use SCAN iterator or targeted key prefixes.',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'ERR_REDIS_KEYS_ALL';
                diagnostics.push(diagnostic);
            }

            // 6. WSQLite WAL mode recommendation
            if (line.includes('WSQLite(') && !text.includes('wal_mode') && !text.includes('WAL')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'WSQLite Concurrency Tip: Enable WAL mode (wal_mode=True) in config for high-throughput multithreaded readers/writers.',
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.code = 'INFO_SQLITE_WAL';
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }
}
