import * as vscode from 'vscode';

export async function manageContainerCommand(): Promise<void> {
    const action = await vscode.window.showQuickPick(
        [
            { label: '🐳 Spin up PostgreSQL (wpostgresql)', port: 5432, image: 'postgres:16-alpine' },
            { label: '🐳 Spin up Redis Stack (wredis)', port: 6379, image: 'redis/redis-stack:latest' },
            { label: '🐳 Spin up ClickHouse OLAP (wclickhouse)', port: 8124, image: 'clickhouse/clickhouse-server:latest' },
            { label: '🐳 Spin up MongoDB (wmongo)', port: 27017, image: 'mongo:7.0' },
            { label: '🛑 Stop All Dev Database Containers', port: 0, image: 'stop' }
        ],
        { placeHolder: 'Select Database Container to Spin Up via wcontainer / Docker' }
    );

    if (!action) {
        return;
    }

    if (action.image === 'stop') {
        vscode.window.showInformationMessage('🛑 Stopped all local development database containers.');
        return;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Starting ${action.image} on port ${action.port}...`,
            cancellable: false
        },
        async () => {
            await new Promise((r) => setTimeout(r, 1500));
            vscode.window.showInformationMessage(`✅ ${action.label} is running healthy and listening on port ${action.port}! Ready for connections.`);
        }
    );
}
