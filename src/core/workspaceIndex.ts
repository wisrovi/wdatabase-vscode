import * as vscode from 'vscode';
import * as path from 'path';
import { getExtensionConfig } from './config';

export type DBEngine =
    | 'wpostgresql'
    | 'wredis'
    | 'wsqlite'
    | 'wtinydb'
    | 'wmongo'
    | 'wmysql'
    | 'wmariadb'
    | 'wclickhouse'
    | 'wElasticsearch'
    | 'wdatabricks'
    | 'wSnowflake';

export interface PydanticFieldInfo {
    name: string;
    type: string;
    description?: string;
    isPrimaryKey: boolean;
    isNotNull: boolean;
    isUnique: boolean;
}

export interface BoundDBModel {
    className: string;
    tableName: string;
    filePath: string;
    line: number;
    baseClass: 'BaseModel' | 'ForensicModel' | string;
    isForensic: boolean;
    engines: DBEngine[];
    fields: PydanticFieldInfo[];
}

export class WorkspaceIndex {
    private models: BoundDBModel[] = [];

    public async scanWorkspace(): Promise<BoundDBModel[]> {
        const config = getExtensionConfig();
        const excludePattern = `{${config.excludePaths.join(',')}}`;
        const files = await vscode.workspace.findFiles('**/*.py', excludePattern, 500);

        const discoveredModels: Map<string, BoundDBModel> = new Map();
        const usages: Map<string, DBEngine[]> = new Map();

        for (const file of files) {
            const document = await vscode.workspace.openTextDocument(file);
            const text = document.getText();

            // 1. Scan model definitions
            this.parseModelDefinitions(text, file.fsPath, discoveredModels);

            // 2. Scan DB repository bindings
            this.parseDBRepositoryBindings(text, usages);
        }

        // 3. Filter and bind models
        this.models = [];
        for (const [className, model] of discoveredModels.entries()) {
            const boundEngines = usages.get(className) || [];
            
            // If model inherits ForensicModel, automatically bind to wpostgresql
            if (model.isForensic && !boundEngines.includes('wpostgresql')) {
                boundEngines.push('wpostgresql');
            }

            // FILTER: Only keep models that are bound to at least one DB engine
            if (boundEngines.length > 0) {
                model.engines = Array.from(new Set(boundEngines));
                this.models.push(model);
            }
        }

        return this.models;
    }

    public getModels(): BoundDBModel[] {
        return this.models;
    }

    public getModelsByEngine(engine: DBEngine): BoundDBModel[] {
        return this.models.filter((m) => m.engines.includes(engine));
    }

    private parseModelDefinitions(
        text: string,
        filePath: string,
        discoveredModels: Map<string, BoundDBModel>
    ): void {
        const lines = text.split('\n');
        let currentModel: BoundDBModel | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match class definitions inheriting from BaseModel, ForensicModel, ForensicDocument, or ForensicTable
            const classMatch = line.match(/^class\s+([A-Za-z0-9_]+)\s*\(\s*(ForensicModel|ForensicDocument|ForensicTable|BaseModel|[A-Za-z0-9_\.]+)\s*\)\s*:/);
            if (classMatch) {
                const className = classMatch[1];
                const baseClass = classMatch[2];
                const isForensic = baseClass.startsWith('Forensic');

                currentModel = {
                    className,
                    tableName: className.toLowerCase(),
                    filePath,
                    line: i,
                    baseClass,
                    isForensic,
                    engines: [],
                    fields: [],
                };
                discoveredModels.set(className, currentModel);
                continue;
            }

            if (currentModel) {
                // If out of class block, reset
                if (line.match(/^[A-Za-z0-9_]+/)) {
                    currentModel = null;
                    continue;
                }

                // Check __tablename__, __collectionname__, __indexname__, or __keypattern__ override
                const tableMatch = line.match(/(?:__tablename__|__collectionname__|__indexname__|__keypattern__)\s*=\s*["']([^"']+)["']/);
                if (tableMatch) {
                    currentModel.tableName = tableMatch[1];
                }

                // Match field definitions: field_name: type = Field(...)
                const fieldMatch = line.match(/^\s+([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_\[\]\.\, ]+)(?:\s*=\s*Field\((.*?)\))?/);
                if (fieldMatch && !fieldMatch[1].startsWith('__')) {
                    const fieldName = fieldMatch[1];
                    const fieldType = fieldMatch[2].trim();
                    const fieldArgs = fieldMatch[3] || '';

                    const isPrimaryKey = fieldArgs.toLowerCase().includes('primary key') || fieldArgs.toLowerCase().includes('primary');
                    const isNotNull = fieldArgs.toLowerCase().includes('not null');
                    const isUnique = fieldArgs.toLowerCase().includes('unique');

                    currentModel.fields.push({
                        name: fieldName,
                        type: fieldType,
                        description: fieldArgs,
                        isPrimaryKey,
                        isNotNull,
                        isUnique,
                    });
                }
            }
        }
    }

    private parseDBRepositoryBindings(text: string, usages: Map<string, DBEngine[]>): void {
        const addUsage = (className: string, engine: DBEngine) => {
            const list = usages.get(className) || [];
            list.push(engine);
            usages.set(className, list);
        };

        // Regex patterns for DB repository bindings across the 11 w-libraries
        const patterns: { regex: RegExp; engine: DBEngine }[] = [
            { regex: /WPostgreSQL\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wpostgresql' },
            { regex: /WSQLite\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wsqlite' },
            { regex: /WRedis\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wredis' },
            { regex: /WTinyDB\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wtinydb' },
            { regex: /WMongo\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wmongo' },
            { regex: /WMySQL\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wmysql' },
            { regex: /WMariaDB\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wmariadb' },
            { regex: /WClickHouse\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wclickhouse' },
            { regex: /WElasticsearch\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wElasticsearch' },
            { regex: /WDatabricks\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wdatabricks' },
            { regex: /WSnowflake\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wSnowflake' },
            { regex: /TableSync\s*\(\s*([A-Za-z0-9_]+)/g, engine: 'wpostgresql' },
            { regex: /backup_db_to_sqlite\s*\(\s*\[?\s*([A-Za-z0-9_,\s]+)/g, engine: 'wsqlite' },
        ];

        for (const item of patterns) {
            let match: RegExpExecArray | null;
            while ((match = item.regex.exec(text)) !== null) {
                const captured = match[1];
                const classNames = captured.split(',').map((s) => s.trim());
                for (const cn of classNames) {
                    if (cn && cn !== 'self') {
                        addUsage(cn, item.engine);
                    }
                }
            }
        }
    }
}
