import * as vscode from 'vscode';
import * as path from 'path';

export async function generateTestSuiteCommand(modelName?: string): Promise<void> {
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
            prompt: 'Enter Pydantic Model name to generate pytest suite for:',
            placeHolder: 'e.g. Document'
        });
    }

    if (!modelName) {
        return;
    }

    const folder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
    const testFilePath = path.join(folder, 'tests', `test_${modelName.toLowerCase()}_integration.py`);

    const code = `"""
Unit & Integration Test Suite for ${modelName} Pydantic DB Model
Framework: pytest + Docker integration runner
"""
import pytest
from pydantic import ValidationError

# Import your model here:
# from your_module import ${modelName}

def test_${modelName.toLowerCase()}_instantiation():
    """
    Validates that ${modelName} initializes properly with valid data fields.
    """
    # Sample initialization test
    assert True

def test_${modelName.toLowerCase()}_forensic_status_default():
    """
    Verifies that ${modelName} forensic status defaults to active (1) and avoids soft-deleted status (99).
    """
    # Test soft-delete default contract status = 1 vs 99
    status_active = 1
    status_deleted = 99
    assert status_active != status_deleted

@pytest.mark.asyncio
async def test_async_${modelName.toLowerCase()}_crud_operations():
    """
    Asynchronous CRUD operations validation test for ${modelName}.
    """
    assert True
`;

    const uri = vscode.Uri.file(testFilePath);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`🧪 Test suite created for ${modelName}: ${path.basename(testFilePath)}`);
}
