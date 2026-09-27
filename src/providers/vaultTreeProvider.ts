import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WAuthVaultProvider implements vscode.TreeDataProvider<VaultTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VaultTreeItem | undefined | null | void> =
        new vscode.EventEmitter<VaultTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<VaultTreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private revealedKeys: Set<string> = new Set();

    constructor() {}

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public toggleReveal(key: string): void {
        if (this.revealedKeys.has(key)) {
            this.revealedKeys.delete(key);
        } else {
            this.revealedKeys.add(key);
        }
        this.refresh();
    }

    public getTreeItem(element: VaultTreeItem): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: VaultTreeItem): Promise<VaultTreeItem[]> {
        if (!element) {
            // Find .db files or default to secrets.db
            const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
            const defaultVault = path.join(workspaceFolder, 'secrets.db');
            const exists = fs.existsSync(defaultVault);

            const items: VaultTreeItem[] = [];

            items.push(
                new VaultTreeItem(
                    `🔐 Vault: secrets.db ${exists ? '(Active)' : '(Not initialized)'}`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'vault_header',
                    undefined,
                    exists ? 'active_vault' : 'empty_vault'
                )
            );

            return items;
        }

        if (element.contextValue === 'active_vault') {
            // Sample managed encrypted secrets for WDatabase
            const secrets = [
                { key: 'POSTGRES_PROD_PASSWORD', encrypted: 'gAAAAABn...', sampleDecrypted: 'SuperSecr3t_Pg2026!' },
                { key: 'CLICKHOUSE_API_TOKEN', encrypted: 'gAAAAABm...', sampleDecrypted: 'ch_live_arrow_token_99' },
                { key: 'REDIS_CLUSTER_AUTH', encrypted: 'gAAAAABk...', sampleDecrypted: 'red_cluster_auth_pass' },
                { key: 'SNOWFLAKE_KEY_PASSPHRASE', encrypted: 'gAAAAABx...', sampleDecrypted: 'sf_rsa_passphrase_salted' },
            ];

            return secrets.map((s) => {
                const isRevealed = this.revealedKeys.has(s.key);
                const displayVal = isRevealed ? s.sampleDecrypted : '•••••••••••••••• (AES-256 Fernet Salted)';
                const item = new VaultTreeItem(
                    `🔑 ${s.key}: ${displayVal}`,
                    vscode.TreeItemCollapsibleState.None,
                    'secret_entry',
                    s.key,
                    'secret_item'
                );
                item.tooltip = `Encrypted Ciphertext: ${s.encrypted}\nClick to toggle reveal`;
                item.command = {
                    command: 'wdatabase.toggleVaultSecret',
                    title: 'Toggle Secret Reveal',
                    arguments: [s.key],
                };
                return item;
            });
        }

        if (element.contextValue === 'empty_vault') {
            const item = new VaultTreeItem(
                '➕ Click to Initialize WAuth Vault (secrets.db)',
                vscode.TreeItemCollapsibleState.None,
                'action_init',
                undefined,
                'init_vault'
            );
            item.command = {
                command: 'wdatabase.addVaultSecret',
                title: 'Initialize Vault',
            };
            return [item];
        }

        return [];
    }
}

export class VaultTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly nodeType: string,
        public readonly secretKey?: string,
        public readonly customContextValue?: string
    ) {
        super(label, collapsibleState);
        this.contextValue = customContextValue || nodeType;
    }
}
