import * as vscode from 'vscode';

export async function launchModelWizard(): Promise<void> {
    const engine = await vscode.window.showQuickPick(
        [
            'wpostgresql (PostgreSQL ORM)',
            'wsqlite (SQLite Embedded)',
            'wredis (Redis Cache)',
            'wtinydb (TinyDB JSON)',
            'wmongo (MongoDB NoSQL)',
        ],
        { placeHolder: 'Step 1: Select Target DB Engine' }
    );

    if (!engine) {
        return;
    }

    const className = await vscode.window.showInputBox({
        prompt: 'Step 2: Enter Pydantic Model Class Name (e.g. User, Product)',
        value: 'UserModel',
    });

    if (!className) {
        return;
    }

    const enableForensic = await vscode.window.showQuickPick(
        ['Yes - Enable Forensic Audit (ForensicModel: status=99 soft delete & UTC audit)', 'No - Standard BaseModel'],
        { placeHolder: 'Step 3: Enable Forensic Audit Tracking?' }
    );

    if (!enableForensic) {
        return;
    }

    const isForensic = enableForensic.startsWith('Yes');
    const baseClass = isForensic ? 'ForensicModel' : 'BaseModel';

    const generatedCode = `from pydantic import Field\nfrom wpostgresql import ${baseClass}\n\nclass ${className}(${baseClass}):\n    id: int = Field(description="Primary Key")\n    name: str = Field(description="NOT NULL")\n    email: str = Field(description="UNIQUE")\n`;

    const doc = await vscode.workspace.openTextDocument({
        content: generatedCode,
        language: 'python',
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`✨ Pydantic DB model '${className}' generated successfully!`);
}
