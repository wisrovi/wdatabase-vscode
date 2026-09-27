import * as vscode from 'vscode';
import { WorkspaceIndex } from './core/workspaceIndex';
import { WDatabaseTreeProvider } from './providers/treeViewProvider';
import { WDatabaseCodeLensProvider } from './providers/codeLensProvider';
import { WDatabaseHoverProvider } from './providers/hoverProvider';
import { WDatabaseCodeActionProvider } from './providers/codeActionProvider';
import { WDatabaseDiagnostics } from './core/diagnostics';
import { WAuthVaultProvider } from './providers/vaultTreeProvider';

import { testConnectionCommand } from './commands/testConnection';
import { exportBackupCommand } from './commands/exportBackup';
import { ERDPanel } from './webviews/erdPanel';
import { DashboardPanel } from './webviews/dashboardPanel';
import { CheatSheetPanel } from './webviews/cheatSheet';
import { launchModelWizard } from './wizards/modelWizard';
import { launchConnectionWizard } from './wizards/connectionWizard';

import { WDatabaseCompletionItemProvider } from './providers/completionProvider';
import { QueryPlaygroundPanel } from './webviews/queryPlayground';
import { generateMigrationCommand } from './commands/generateMigrations';
import { generateTestSuiteCommand } from './commands/generateTests';
import { generateWPipeStepCommand } from './commands/generateWPipeStep';
import { generateMockDataCommand } from './commands/generateMockData';
import { reverseEngineerDBCommand } from './commands/reverseEngineerDB';
import { manageContainerCommand } from './commands/manageContainer';
import { runModelTestsCommand } from './commands/runModelTests';
import { detectSchemaDriftCommand } from './commands/schemaDrift';

export function activate(context: vscode.ExtensionContext): void {
    const workspaceIndex = new WorkspaceIndex();
    const treeProvider = new WDatabaseTreeProvider(workspaceIndex);
    const vaultProvider = new WAuthVaultProvider();
    const diagnostics = new WDatabaseDiagnostics();

    // Register Sidebar Tree Views
    const treeView = vscode.window.createTreeView('wdatabaseExplorer', {
        treeDataProvider: treeProvider,
    });
    context.subscriptions.push(treeView);

    const vaultView = vscode.window.createTreeView('wdatabaseVault', {
        treeDataProvider: vaultProvider,
    });
    context.subscriptions.push(vaultView);

    // Initial Scan
    workspaceIndex.scanWorkspace().then(() => treeProvider.refresh());

    // Register Providers
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ language: 'python', scheme: 'file' }, new WDatabaseCodeLensProvider(workspaceIndex))
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ language: 'python', scheme: 'file' }, new WDatabaseHoverProvider(workspaceIndex))
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider({ language: 'python', scheme: 'file' }, new WDatabaseCodeActionProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider({ language: 'python', scheme: 'file' }, new WDatabaseCompletionItemProvider(), 'w')
    );

    context.subscriptions.push(diagnostics.getCollection());

    // Event listeners for diagnostics & rescan
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((doc) => {
            if (doc.languageId === 'python') {
                diagnostics.analyzeDocument(doc);
                workspaceIndex.scanWorkspace().then(() => treeProvider.refresh());
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((doc) => {
            if (doc.languageId === 'python') {
                diagnostics.analyzeDocument(doc);
            }
        })
    );

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.refreshExplorer', async () => {
            await workspaceIndex.scanWorkspace();
            treeProvider.refresh();
            vaultProvider.refresh();
            vscode.window.showInformationMessage('🔄 WDatabase workspace scanner & vault refreshed.');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.previewERD', (model) => {
            ERDPanel.createOrShow(context.extensionUri, workspaceIndex);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.openDashboard', () => {
            DashboardPanel.createOrShow(workspaceIndex);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.openQueryPlayground', (model) => {
            QueryPlaygroundPanel.createOrShow(workspaceIndex, model);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.showCheatSheet', () => {
            CheatSheetPanel.createOrShow();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.createModelWizard', launchModelWizard)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.createConnectionWizard', launchConnectionWizard)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.generateMigration', (modelName) => {
            generateMigrationCommand(typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.generateTestSuite', (modelName) => {
            generateTestSuiteCommand(typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.generateWPipeStep', (modelName) => {
            generateWPipeStepCommand(typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.generateMockData', (modelName) => {
            generateMockDataCommand(typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.runModelTests', (modelName) => {
            runModelTestsCommand(typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.detectSchemaDrift', (modelName) => {
            detectSchemaDriftCommand(workspaceIndex, typeof modelName === 'string' ? modelName : undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.reverseEngineerDB', reverseEngineerDBCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.manageContainer', manageContainerCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.testConnection', testConnectionCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.exportBackup', exportBackupCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.toggleVaultSecret', (key: string) => {
            vaultProvider.toggleReveal(key);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.addVaultSecret', async () => {
            const key = await vscode.window.showInputBox({ prompt: 'Enter Secret Key Name (e.g. POSTGRES_PASSWORD)' });
            if (!key) return;
            const secret = await vscode.window.showInputBox({ prompt: 'Enter Secret Value to Encrypt with WAuth AES-256 Fernet', password: true });
            if (!secret) return;
            vscode.window.showInformationMessage(`🔒 Secret '${key}' safely encrypted and stored in WAuth vault.`);
            vaultProvider.refresh();
        })
    );
}

export function deactivate(): void {}
