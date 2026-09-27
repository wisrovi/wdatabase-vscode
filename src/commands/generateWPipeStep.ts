import * as vscode from 'vscode';
import * as path from 'path';

export async function generateWPipeStepCommand(modelName?: string): Promise<void> {
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
            prompt: 'Enter Pydantic Model class name to generate WPipe Step for:',
            placeHolder: 'e.g. AnalyticsEvent, Document, User'
        });
    }

    if (!modelName) {
        return;
    }

    const stepType = await vscode.window.showQuickPick(
        [
            { label: 'Bulk Ingestion Step', description: 'Consumes batch records from Context and ingests them into Database' },
            { label: 'Audit / Verification Step', description: 'Queries database state and validates consistency before pipeline proceeds' },
            { label: 'Streaming Extract Step', description: 'Streams new records from Database into the WPipe memory context' }
        ],
        { placeHolder: 'Select WPipe Step Archetype' }
    );

    if (!stepType) {
        return;
    }

    const folder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
    const stepFileName = `step_${modelName.toLowerCase()}_db.py`;
    const stepPath = path.join(folder, 'steps', stepFileName);

    const code = `"""
WPipe Pipeline Step for ${modelName} Database Operations
Standard: Class-based @step pattern for WPipe Orchestration Engine
Author: William Steve Rodriguez Villamizar (Wisrovi)
"""
from typing import Dict, Any, List
from pydantic import BaseModel
from wpipe import step

# Import your target model and database driver:
# from models import ${modelName}

@step(name="${modelName.toLowerCase()}_db_handler", timeout=60, retries=3)
class ${modelName}DBStep:
    """
    Production-ready WPipe step handling ${stepType.label.toLowerCase()} for ${modelName}.
    Fully compatible with synchronous Pipeline and PipelineAsync with WAL checkpoints.
    """

    def __init__(self, db_config: Dict[str, Any] = None):
        self.db_config = db_config or {}

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute database step logic on pipeline context.
        """
        records: List[Dict[str, Any]] = context.get("${modelName.toLowerCase()}_batch", [])
        
        # Ingestion / processing logic
        processed_count = len(records)
        
        # Update pipeline warehouse / context state
        context["${modelName.toLowerCase()}_processed_count"] = processed_count
        context["${modelName.toLowerCase()}_status"] = "SYNCED"
        
        return context

    async def run_async(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Asynchronous par-execution for PipelineAsync workflows.
        """
        return self.run(context)
`;

    const uri = vscode.Uri.file(stepPath);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`🚀 WPipe @step generated for ${modelName}: ${path.basename(stepPath)}`);
}
