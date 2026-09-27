import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceIndex, BoundDBModel } from '../core/workspaceIndex';

export async function exportDataDictionaryCommand(workspaceIndex: WorkspaceIndex) {
    const models = workspaceIndex.getModels();
    if (models.length === 0) {
        vscode.window.showWarningMessage('No Pydantic DB models detected in workspace to generate Data Dictionary.');
        return;
    }

    const defaultUri = vscode.Uri.file(
        path.join(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.', 'DATABASE_SCHEMA.md')
    );

    const fileUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { 'Markdown Documentation': ['md'], 'All Files': ['*'] }
    });

    if (!fileUri) return;

    let md = '';
    md += `# 📑 Database Schema & Architecture Data Dictionary\n\n`;
    md += `> Generated automatically by **WDatabase Tools for VS Code / Antigravity IDE**\n`;
    md += `> Author: **William Steve Rodriguez Villamizar (Wisrovi)** | Contact: \`wisrovi.rodriguez@gmail.com\`\n`;
    md += `> Date: ${new Date().toISOString()}\n\n`;

    md += `## 🌟 Executive Overview\n\n`;
    md += `- **Total Entities / Tables:** ${models.length}\n`;
    const engines = Array.from(new Set(models.flatMap(m => m.engines)));
    md += `- **Target Storage Engines:** ${engines.map(e => `\`${e}\``).join(', ')}\n`;
    md += `- **Forensic Audit Compliance:** ${models.filter(m => m.isForensic).length} models enabled with \`ForensicModel\` (\`status=99\` versioned soft delete)\n\n`;

    md += `## 🗄️ Entities & Column Specifications\n\n`;

    models.forEach(model => {
        md += `### Table: \`${model.tableName}\`\n\n`;
        md += `- **Pydantic Model:** \`${model.className}\` (defined in \`${path.basename(model.filePath)}:${model.line}\`)\n`;
        md += `- **Base Class:** \`${model.baseClass}\` ${model.isForensic ? '🛡️ *(Forensic Audit Enabled)*' : ''}\n`;
        md += `- **Bound Engines:** ${model.engines.map(e => `\`${e}\``).join(', ')}\n\n`;

        md += `| Column / Field | Python Type | Constraints | Description |\n`;
        md += `|---|---|---|---|\n`;

        model.fields.forEach(f => {
            const constraints: string[] = [];
            if (f.isPrimaryKey) constraints.push('🔑 **PRIMARY KEY**');
            if (f.isNotNull) constraints.push('NOT NULL');
            if (f.isUnique) constraints.push('UNIQUE');
            if (constraints.length === 0) constraints.push('Nullable');

            md += `| \`${f.name}\` | \`${f.type}\` | ${constraints.join(', ')} | ${f.description || '-'} |\n`;
        });

        md += `\n`;

        // SQL DDL preview
        md += `<details><summary>View Standard SQL DDL</summary>\n\n\`\`\`sql\n`;
        md += `CREATE TABLE ${model.tableName} (\n`;
        const colDefs = model.fields.map(f => {
            let sqlType = 'TEXT';
            const t = f.type.toLowerCase();
            if (t.includes('int')) sqlType = 'INTEGER';
            else if (t.includes('float')) sqlType = 'DOUBLE PRECISION';
            else if (t.includes('bool')) sqlType = 'BOOLEAN';
            else if (t.includes('datetime')) sqlType = 'TIMESTAMP';
            else if (t.includes('dict') || t.includes('json')) sqlType = 'JSONB';

            let line = `    ${f.name} ${sqlType}`;
            if (f.isPrimaryKey) line += ' PRIMARY KEY';
            if (f.isNotNull) line += ' NOT NULL';
            if (f.isUnique) line += ' UNIQUE';
            return line;
        });
        md += colDefs.join(',\n');
        md += `\n);\n\`\`\`\n</details>\n\n---\n\n`;
    });

    md += `## 📚 Architecture Standards & Best Practices\n\n`;
    md += `1. **Forensic Audit Pattern**: Deleted records must not be dropped using \`DELETE FROM\`. Instead, flag \`status = 99\` and increment \`forensic_version\`.\n`;
    md += `2. **OLAP Columnar Ingest**: When writing to ClickHouse (\`wclickhouse\`), always ingest batches with \`insert_many()\` or Apache Arrow IPC streams to maximize throughput.\n`;
    md += `3. **Secrets Management**: Database passwords and credentials must be stored encrypted using AES-256 Fernet via \`wauth\` machine-salted vaults.\n`;

    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(md, 'utf8'));

    const openDoc = await vscode.window.showInformationMessage(
        `✅ Data Dictionary generated at ${fileUri.fsPath}`,
        'Open Document'
    );

    if (openDoc === 'Open Document') {
        const doc = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(doc);
    }
}
