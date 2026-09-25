import * as vscode from 'vscode';
import { WorkspaceIndex } from './core/workspaceIndex';
import { WDatabaseTreeProvider } from './providers/treeViewProvider';
import { WDatabaseCodeLensProvider } from './providers/codeLensProvider';
import { WDatabaseHoverProvider } from './providers/hoverProvider';
import { WDatabaseCodeActionProvider } from './providers/codeActionProvider';
import { WDatabaseDiagnostics } from './core/diagnostics';
import { testConnectionCommand } from './commands/testConnection';
import { exportBackupCommand } from './commands/exportBackup';
import { ERDPanel } from './webviews/erdPanel';
import { DashboardPanel } from './webviews/dashboardPanel';
import { CheatSheetPanel } from './webviews/cheatSheet';
import { launchModelWizard } from './wizards/modelWizard';
import { launchConnectionWizard } from './wizards/connectionWizard';

export function activate(context: vscode.ExtensionContext): void {
    const workspaceIndex = new WorkspaceIndex();
    const treeProvider = new WDatabaseTreeProvider(workspaceIndex);
    const diagnostics = new WDatabaseDiagnostics();

    // Register Sidebar Tree View
    const treeView = vscode.window.createTreeView('wdatabaseExplorer', {
        treeDataProvider: treeProvider,
    });
    context.subscriptions.push(treeView);

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
            vscode.window.showInformationMessage('🔄 WDatabase workspace scanner refreshed.');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.previewERD', () => {
            ERDPanel.createOrShow(context.extensionUri, workspaceIndex);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.openDashboard', () => {
            DashboardPanel.createOrShow(workspaceIndex);
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
        vscode.commands.registerCommand('wdatabase.testConnection', testConnectionCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('wdatabase.exportBackup', exportBackupCommand)
    );
}

export function deactivate(): void {}
