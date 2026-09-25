import * as vscode from 'vscode';
import { WorkspaceIndex, BoundDBModel, DBEngine } from '../core/workspaceIndex';
import { DATABASE_PATTERNS, DatabasePattern } from '../core/catalog';

export class WDatabaseTreeProvider implements vscode.TreeDataProvider<TreeItemNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItemNode | undefined | null | void> =
        new vscode.EventEmitter<TreeItemNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItemNode | undefined | null | void> =
        this._onDidChangeTreeData.event;

    constructor(private workspaceIndex: WorkspaceIndex) {}

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeItemNode): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: TreeItemNode): Promise<TreeItemNode[]> {
        if (!element) {
            // Root nodes
            const models = await this.workspaceIndex.scanWorkspace();
            const enginesPresent = Array.from(new Set(models.flatMap((m) => m.engines)));

            const items: TreeItemNode[] = [];

            // 1. Connection Environments
            items.push(
                new TreeItemNode(
                    '🌐 DB CONNECTIONS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'category',
                    undefined,
                    'db_connections'
                )
            );

            // 2. Bound DB Models by Engine
            items.push(
                new TreeItemNode(
                    '🗄️ BOUND MODELS BY ENGINE',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'category',
                    undefined,
                    'bound_engines',
                    enginesPresent
                )
            );

            // 3. Pattern Catalog Snippets
            items.push(
                new TreeItemNode(
                    '📚 PATTERNS & SNIPPETS',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'category',
                    undefined,
                    'snippets_catalog'
                )
            );

            return items;
        }

        if (element.contextValue === 'bound_engines') {
            const models = this.workspaceIndex.getModels();
            const enginesPresent = Array.from(new Set(models.flatMap((m) => m.engines))) as DBEngine[];

            return enginesPresent.map((engine) => {
                const count = this.workspaceIndex.getModelsByEngine(engine).length;
                const iconMap: Record<DBEngine, string> = {
                    wpostgresql: '🐘',
                    wredis: '🔴',
                    wsqlite: '📦',
                    wtinydb: '📄',
                    wmongo: '🍃',
                    wmysql: '🐬',
                    wmariadb: '🦭',
                    wclickhouse: '📊',
                    wElasticsearch: '🔍',
                    wdatabricks: '🧱',
                    wSnowflake: '❄️',
                };
                const icon = iconMap[engine] || '📁';

                return new TreeItemNode(
                    `${icon} ${engine} (${count} models)`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'engine',
                    undefined,
                    `engine_${engine}`,
                    engine
                );
            });
        }

        if (element.contextValue?.startsWith('engine_')) {
            const engine = element.extraData as DBEngine;
            const models = this.workspaceIndex.getModelsByEngine(engine);

            return models.map((model) => {
                let badge = '';
                if (model.isForensic) {
                    badge = ' [ForensicAudit | status=99]';
                } else if (['wmongo', 'wtinydb', 'wElasticsearch'].includes(engine)) {
                    badge = ` [${engine === 'wmongo' ? 'Collection' : engine === 'wElasticsearch' ? 'Index' : 'JSON Document'}]`;
                }

                const item = new TreeItemNode(
                    `📄 ${model.className}${badge}`,
                    vscode.TreeItemCollapsibleState.None,
                    'model',
                    model
                );
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [
                        vscode.Uri.file(model.filePath),
                        { selection: new vscode.Range(model.line, 0, model.line, 0) },
                    ],
                };
                return item;
            });
        }

        if (element.contextValue === 'db_connections') {
            return [
                new TreeItemNode('Localhost PostgreSQL:5432 🟢', vscode.TreeItemCollapsibleState.None, 'connection'),
                new TreeItemNode('Localhost Redis:6379 🟢', vscode.TreeItemCollapsibleState.None, 'connection'),
                new TreeItemNode('Embedded SQLite (app.db) 🟢', vscode.TreeItemCollapsibleState.None, 'connection'),
            ];
        }

        if (element.contextValue === 'snippets_catalog') {
            return DATABASE_PATTERNS.map((pattern) => {
                const item = new TreeItemNode(
                    `⚡ ${pattern.title}`,
                    vscode.TreeItemCollapsibleState.None,
                    'pattern',
                    undefined,
                    undefined,
                    pattern
                );
                item.tooltip = pattern.description;
                return item;
            });
        }

        return [];
    }
}

export class TreeItemNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly nodeType: 'category' | 'engine' | 'model' | 'connection' | 'pattern',
        public readonly modelInfo?: BoundDBModel,
        public readonly customContextValue?: string,
        public readonly extraData?: any
    ) {
        super(label, collapsibleState);
        this.contextValue = customContextValue || nodeType;
    }
}
