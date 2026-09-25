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
            placeHolder: 'e.g. Document'
        });
    }

    if (!modelName) {
        return;
    }

    const engineChoice = await vscode.window.showQuickPick(
        [
            { label: 'wpostgresql', description: 'PostgreSQL Migration Script (ALTER/CREATE TABLE + Forensic Trigger)' },
            { label: 'wsqlite', description: 'SQLite Local Migration Script' }
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

    const code = `"""
Auto-generated migration script for ${modelName} (${engineChoice.label})
Generated at: ${new Date().toISOString()}
"""
from ${engineChoice.label} import ${engineChoice.label === 'wpostgresql' ? 'WPostgreSQL, ForensicModel' : 'WSQLite'}
from pydantic import BaseModel
import sys

def upgrade():
    """Apply migration changes"""
    print(f"[UPGRADE] Applying schema changes for model: ${modelName} on ${engineChoice.label}")
    # Example table schema creation / alteration logic:
    # ALTER TABLE ${modelName.toLowerCase()} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

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

    vscode.window.showInformationMessage(`⚡ Migration script created: ${path.basename(migrationPath)}`);
}
