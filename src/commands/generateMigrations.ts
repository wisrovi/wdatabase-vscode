import * as vscode from 'vscode';
import * as path from 'path';

export async function generateMigrationCommand(modelName?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!modelName && editor) {
        const text = editor.document.getText();
        const match = text.match(/class\s+([A-Za-z0-9_]+)\s*\((?:ForensicModel|BaseModel|ForensicDocument)\)/);
        if (match) {
            modelName = match[1];
        }
    }

    if (!modelName) {
        modelName = await vscode.window.showInputBox({
            prompt: 'Enter the Pydantic DB Model class name for migration generation:',
            placeHolder: 'e.g. Document, AnalyticsEvent, User'
        });
    }

    if (!modelName) {
        return;
    }

    const engineChoice = await vscode.window.showQuickPick(
        [
            { label: 'wpostgresql', description: 'PostgreSQL Migration (ALTER/CREATE TABLE + Forensic Trigger + TableSync)' },
            { label: 'wsqlite', description: 'SQLite Local Migration (TableSync & WAL mode validation)' },
            { label: 'wclickhouse', description: 'ClickHouse Schema Sync (Adding Columnar fields to MergeTree table)' },
            { label: 'wmongo', description: 'MongoDB Collection Schema Validation & Index Migration' },
            { label: 'wmysql', description: 'MySQL Schema Migration (InnoDB table sync)' },
            { label: 'wmariadb', description: 'MariaDB Schema Migration (Aria/InnoDB table sync)' },
        ],
        { placeHolder: 'Select target database engine for migration:' }
    );

    if (!engineChoice) {
        return;
    }

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `migration_${timestamp}_${modelName.toLowerCase()}.py`;
    const folder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
    const migrationPath = path.join(folder, 'migrations', fileName);

    let importBlock = '';
    let upgradeLogic = '';

    if (engineChoice.label === 'wpostgresql') {
        importBlock = 'from wpostgresql import WPostgreSQL, ForensicModel\nfrom pydantic import BaseModel';
        upgradeLogic = `    # 1. PostgreSQL Schema Migration with TableSync
    # Automatically synchronizes columns without dropping existing data
    print(f"[UPGRADE] Running PostgreSQL TableSync for model: ${modelName}")
    # Example: db = WPostgreSQL(${modelName}, db_config)`;
    } else if (engineChoice.label === 'wclickhouse') {
        importBlock = 'from wclickhouse import WClickHouse\nfrom pydantic import BaseModel';
        upgradeLogic = `    # 2. ClickHouse Columnar Table Sync
    print(f"[UPGRADE] Syncing ClickHouse MergeTree columns for: ${modelName}")
    # Example: db = WClickHouse(${modelName}, db_config)`;
    } else if (engineChoice.label === 'wsqlite') {
        importBlock = 'from wsqlite import WSQLite\nfrom pydantic import BaseModel';
        upgradeLogic = `    # 3. SQLite Reactive Schema TableSync
    print(f"[UPGRADE] Applying SQLite reactive migrations for: ${modelName}")
    # Example: db = WSQLite(${modelName}, db_config)`;
    } else {
        importBlock = `from ${engineChoice.label} import ${engineChoice.label.toUpperCase()}\nfrom pydantic import BaseModel`;
        upgradeLogic = `    # 4. Engine Table Sync
    print(f"[UPGRADE] Applying schema update on ${engineChoice.label} for ${modelName}")`;
    }

    const code = `"""
Auto-generated migration script for ${modelName} (${engineChoice.label})
Generated at: ${new Date().toISOString()}
Author: William Steve Rodriguez Villamizar (Wisrovi)
"""
${importBlock}
import sys

def upgrade():
    """Apply migration changes"""
${upgradeLogic}

def downgrade():
    """Revert migration changes"""
    print(f"[DOWNGRADE] Reverting schema changes for model: ${modelName}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
`;

    const uri = vscode.Uri.file(migrationPath);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`⚡ Migration script created for ${engineChoice.label}: ${path.basename(migrationPath)}`);
}
