# WDatabase Tools VS Code Extension - Internal Core (`src/`)

This directory contains the TypeScript source code for the **WDatabase Tools** VS Code extension.

## Directory Structure & Module Architecture

- **`extension.ts`**: Main extension entrypoint handling activation lifecycle, command registration, and provider registration.
- **`core/`**:
  - `config.ts`: Reads extension workspace settings.
  - `workspaceIndex.ts`: AST-based DB-Binding Engine. Scans Python files, filters out non-DB Pydantic models, and attributes bound models to their respective database engines (`wpostgresql`, `wsqlite`, `wredis`, `wtinydb`, `wmongo`, etc.).
  - `catalog.ts`: Pattern catalog of runnable code snippets across all 11 database libraries in the ecosystem.
  - `diagnostics.ts`: Real-time code analyzer reporting anti-patterns and missing constraints.
- **`providers/`**:
  - `treeViewProvider.ts`: Sidebar TreeView (`wdatabaseExplorer`) categorizing bound models by DB engine and displaying `ForensicModel` soft-delete badges (`status=99`).
  - `codeLensProvider.ts`: Inline CodeLens actions rendered above DB-bound model classes.
  - `hoverProvider.ts`: Rich tooltips with table schemas, constraints, and audit field status.
  - `codeActionProvider.ts`: Quick Fixes for common model/DB parameter issues.
- **`commands/`**: Handlers for testing connections, triggering backups, and launching dashboards.
- **`webviews/`**: Interactive HTML5/TypeScript panels for Entity-Relationship Diagrams (`erdPanel`), Control Center (`dashboardPanel`), and CheatSheets (`cheatSheet`).
- **`wizards/`**: Interactive QuickPick wizards for generating Pydantic DB models and connection configurations.

## Relevant Technologies & Key Libraries

- **VS Code Extension API (`vscode`)**: Core framework for UI controls, TreeViews, CodeLens, Webviews, and Commands.
- **TypeScript (`^5.0.0`)**: Strongly typed language for reliable extension logic.
- **Mermaid.js / Vis.js**: Client-side visualization engines for dynamic ERD generation inside Webviews.
- **AST Regex & Symbol Analysis**: Custom parser for Python Pydantic model detection and database repository call-site mapping.
