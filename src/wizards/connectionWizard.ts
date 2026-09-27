import * as vscode from 'vscode';

export async function launchConnectionWizard(): Promise<void> {
    const enginePick = await vscode.window.showQuickPick(
        [
            { label: 'wpostgresql', description: 'PostgreSQL connection config (port 5432)' },
            { label: 'wredis', description: 'Redis connection config (port 6379)' },
            { label: 'wsqlite', description: 'SQLite database path config' },
            { label: 'wclickhouse', description: 'ClickHouse OLAP server config (port 8124)' },
            { label: 'wmongo', description: 'MongoDB connection URI / config (port 27017)' },
            { label: 'wmysql', description: 'MySQL connection config (port 3306)' },
            { label: 'wmariadb', description: 'MariaDB connection config (port 3306)' },
            { label: 'wElasticsearch', description: 'Elasticsearch cluster URL (port 9200)' },
            { label: 'wdatabricks', description: 'Databricks SQL endpoint & token' },
            { label: 'wSnowflake', description: 'Snowflake account & warehouse credentials' },
        ],
        { placeHolder: 'Select Database Engine to Configure' }
    );

    if (!enginePick) {
        return;
    }

    const engine = enginePick.label;
    let configCode = '';

    if (engine === 'wsqlite') {
        const dbPath = await vscode.window.showInputBox({
            prompt: 'SQLite Database File Path',
            value: './app_database.db',
        });
        if (!dbPath) return;

        configCode = `db_config = {\n    "db_path": "${dbPath}",\n    "wal_mode": True,\n    "timeout": 30.0,\n}\n`;
    } else if (engine === 'wclickhouse') {
        const host = await vscode.window.showInputBox({ prompt: 'ClickHouse Host', value: 'localhost' });
        if (!host) return;
        const port = await vscode.window.showInputBox({ prompt: 'ClickHouse HTTP/Native Port', value: '8124' });
        if (!port) return;

        configCode = `import os\n\ndb_config = {\n    "host": "${host}",\n    "port": ${port},\n    "username": os.getenv("CLICKHOUSE_USER", "default"),\n    "password": os.getenv("CLICKHOUSE_PASSWORD", ""),\n    "database": "default",\n}\n`;
    } else if (engine === 'wredis') {
        const host = await vscode.window.showInputBox({ prompt: 'Redis Host', value: 'localhost' });
        if (!host) return;
        const port = await vscode.window.showInputBox({ prompt: 'Redis Port', value: '6379' });
        if (!port) return;

        configCode = `import os\n\nredis_config = {\n    "host": "${host}",\n    "port": ${port},\n    "db": 0,\n    "password": os.getenv("REDIS_PASSWORD", None),\n    "decode_responses": True,\n}\n`;
    } else if (engine === 'wmongo') {
        configCode = `import os\n\nmongo_config = {\n    "uri": os.getenv("MONGO_URI", "mongodb://localhost:27017"),\n    "database": "production_db",\n}\n`;
    } else {
        const host = await vscode.window.showInputBox({ prompt: 'Database Host', value: 'localhost' });
        if (!host) return;

        const defaultPort = engine === 'wpostgresql' ? '5432' : engine.includes('mysql') || engine.includes('maria') ? '3306' : '9200';
        const port = await vscode.window.showInputBox({ prompt: 'Database Port', value: defaultPort });
        if (!port) return;

        const dbname = await vscode.window.showInputBox({ prompt: 'Database Name', value: 'app_db' });
        if (!dbname) return;

        configCode = `import os\n\ndb_config = {\n    "dbname": "${dbname}",\n    "user": os.getenv("DB_USER", "postgres"),\n    "password": os.getenv("DB_PASSWORD", ""),\n    "host": "${host}",\n    "port": ${port},\n}\n`;
    }

    const doc = await vscode.workspace.openTextDocument({
        content: configCode,
        language: 'python',
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`✨ Secure ${engine} connection configuration generated.`);
}
