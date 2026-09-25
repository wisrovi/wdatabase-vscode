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

            // 3. Check for hardcoded plain text passwords in db_config
            if (line.includes('"password":') && !line.includes('os.getenv') && !line.includes('os.environ')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'WDatabase Security Suggestion: Avoid hardcoding database passwords in plaintext. Use os.getenv().',
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.code = 'INFO_HARDCODED_PWD';
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }
}
