import * as vscode from 'vscode';

export async function launchModelWizard(): Promise<void> {
    const enginePick = await vscode.window.showQuickPick(
        [
            { label: 'wpostgresql', description: 'Enterprise PostgreSQL ORM with ForensicModel (status=99)' },
            { label: 'wsqlite', description: 'Embedded SQLite ORM with TableSync, Composite Keys & WAL Mode' },
            { label: 'wredis', description: 'Ultra-fast Redis Cache, Key-Value & Distributed Locks' },
            { label: 'wclickhouse', description: 'High-speed Columnar OLAP with Apache Arrow & Pandas integration' },
            { label: 'wmongo', description: 'Reactive MongoDB ODM with Redis Caching Layer' },
            { label: 'wtinydb', description: 'Lightweight JSON Document Persistence' },
            { label: 'wmysql', description: 'MySQL Relational Repository with Connection Pooling' },
            { label: 'wmariadb', description: 'MariaDB ACID High-Concurrency Pool' },
            { label: 'wElasticsearch', description: 'Full-Text Search & Real-Time Analytics Index' },
            { label: 'wdatabricks', description: 'Delta Lake & Big Data Analytics Engine' },
            { label: 'wSnowflake', description: 'Cloud Data Warehouse Analytical Models' },
        ],
        { placeHolder: 'Step 1: Select Target Database Engine' }
    );

    if (!enginePick) {
        return;
    }

    const selectedEngine = enginePick.label;

    const className = await vscode.window.showInputBox({
        prompt: 'Step 2: Enter Pydantic Model Class Name (e.g. AnalyticsEvent, User, TelemetryData)',
        value: 'AnalyticsEvent',
    });

    if (!className) {
        return;
    }

    let isForensic = false;
    if (selectedEngine === 'wpostgresql') {
        const enableForensic = await vscode.window.showQuickPick(
            [
                'Yes - Enable Forensic Audit (ForensicModel: status=99 soft delete & UTC audit tracking)',
                'No - Standard Pydantic BaseModel'
            ],
            { placeHolder: 'Step 3: Enable Forensic Audit Tracking for PostgreSQL?' }
        );
        isForensic = enableForensic?.startsWith('Yes') ?? false;
    }

    let generatedCode = '';

    if (selectedEngine === 'wpostgresql') {
        const baseClass = isForensic ? 'ForensicModel' : 'BaseModel';
        const importSrc = isForensic ? 'from wpostgresql import ForensicModel\nfrom pydantic import Field' : 'from pydantic import BaseModel, Field';
        generatedCode = `${importSrc}\n\nclass ${className}(${baseClass}):\n    id: int = Field(description="Primary Key")\n    title: str = Field(description="NOT NULL")\n    email: str = Field(description="UNIQUE")\n`;
    } else if (selectedEngine === 'wsqlite') {
        generatedCode = `from pydantic import BaseModel, Field\nfrom datetime import datetime\n\nclass ${className}(BaseModel):\n    id: int = Field(description="Primary Key")\n    name: str = Field(description="NOT NULL")\n    created_at: datetime = Field(default_factory=datetime.utcnow)\n`;
    } else if (selectedEngine === 'wclickhouse') {
        generatedCode = `from pydantic import BaseModel, Field\nfrom datetime import datetime\nfrom typing import List\n\nclass ${className}(BaseModel):\n    event_id: int\n    event_name: str\n    tags: List[str] = []\n    created_at: datetime = Field(default_factory=datetime.utcnow)\n`;
    } else if (selectedEngine === 'wredis') {
        generatedCode = `from pydantic import BaseModel\nfrom typing import Optional\n\nclass ${className}(BaseModel):\n    user_id: str\n    session_token: str\n    role: str = "member"\n    expires_in: int = 3600\n`;
    } else if (selectedEngine === 'wmongo' || selectedEngine === 'wtinydb') {
        generatedCode = `from pydantic import BaseModel, Field\nfrom datetime import datetime\n\nclass ${className}(BaseModel):\n    doc_id: str = Field(description="Primary Key")\n    payload: dict = Field(default_factory=dict)\n    updated_at: datetime = Field(default_factory=datetime.utcnow)\n`;
    } else {
        generatedCode = `from pydantic import BaseModel, Field\n\nclass ${className}(BaseModel):\n    id: int = Field(description="Primary Key")\n    name: str = Field(description="NOT NULL")\n`;
    }

    const doc = await vscode.workspace.openTextDocument({
        content: generatedCode,
        language: 'python',
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`✨ Pydantic DB model '${className}' for ${selectedEngine} generated successfully!`);
}
