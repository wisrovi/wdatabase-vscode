# WDatabase Tools for Visual Studio Code (`wdatabase-vscode`)

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=wisrovi.wdatabase-vscode">
    <img src="https://img.shields.io/badge/VS_Code-WDatabase_Tools-blue?logo=visualstudiocode" alt="VS Code Extension">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://github.com/wisrovi/wdatabase-vscode">
    <img src="https://img.shields.io/badge/Version-1.0.0-purple" alt="Version">
  </a>
</p>

**WDatabase Tools** is the intelligent control suite & visual IDE extension for the `w` database library ecosystem. It automatically scans your Python workspace, filters out non-database Pydantic models (such as FastAPI request/response DTOs), categorizes bound models by database engine, and provides interactive ERD diagrams, CodeLens actions, and visual data inspectors.

## Features

- **Zero-Noise DB-Binding Engine**: Automatically distinguishes Pydantic models used in database repositories from plain API schemas or settings, excluding non-DB schemas from view.
- **Multi-Engine Categorization**: Classifies models by target database engine (`wpostgresql`, `wsqlite`, `wredis`, `wtinydb`, `wmongo`, etc.).
- **Forensic Audit Inspection**: Displays soft-delete badges (`status=99`) and UTC audit fields (`create_by`, `create_in`, `update_by`, `update_in`, `delete_by`, `delete_in`) on models inheriting from `ForensicModel`.
- **Interactive ERD Diagram Visualizer**: Generates dynamic Entity-Relationship Diagrams in SVG/Mermaid format directly from your Python models.
- **CodeLens & Rich Hover Tooltips**: Hover over Pydantic models to inspect SQL/NoSQL table schemas, constraints, types, and active repository bindings.
- **Real-Time Anti-Pattern Diagnostics**: Detects common mistakes (e.g. passing dict to `db.update()`, missing Primary Keys) with one-click Quick Fixes.
- **Model & Connection Wizards**: Step-by-step QuickPick wizards for generating `BaseModel` or `ForensicModel` classes and connection dictionaries.

## Supported Database Libraries

| Library | Engine Type | Key Extension Features |
|---|---|---|
| `wpostgresql` | PostgreSQL ORM | `WPostgreSQL`, `ForensicModel` (`status=99`), `TableSync`, async, pooling. |
| `wredis` | Redis Cache / PubSub | `WRedis`, key patterns, TTL expiration, caching. |
| `wsqlite` | SQLite Embedded | `WSQLite`, local persistence, atomic backups. |
| `wtinydb` | TinyDB JSON | `WTinyDB`, lightweight JSON document CRUD. |
| `wmongo` | MongoDB NoSQL | `WMongo`, BSON document mapping, aggregations. |
| `wmysql` / `wmariadb` | MySQL / MariaDB | Schema sync, CRUD, transactions. |
| `wclickhouse` | ClickHouse Columnar | Bulk insertion, analytical time-series queries. |
| `wElasticsearch` | Elasticsearch | Full-text indexing, mapping, search. |
| `wdatabricks` / `wSnowflake` | Cloud Lakehouse / Warehouse | SQL query execution and staging. |

## Relevant Technologies & Key Libraries

- **VS Code Extension API (`vscode ^1.75.0`)**: Core extension framework for activity bar views, CodeLens, hover providers, diagnostics, and webviews.
- **TypeScript (`^5.0.0`)**: Strongly typed extension codebase.
- **AST Symbol Parser**: Custom AST inspection engine for scanning Python files and resolving model-to-repository call sites.
- **Mermaid.js**: Client-side diagramming library for rendering ERD webviews.
- **Pydantic v2 & Python 3.9+**: Target ecosystem for schema definitions.

## Installation

```bash
# Clone the repository
git clone https://github.com/wisrovi/wdatabase-vscode.git
cd wdatabase-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

## Running Tests

Unit and integration tests for the extension are executed via VS Code extension test runner:

```bash
# Compile and run extension tests
npm test
```

Tests verify:
1. AST scanner parsing of `BaseModel` and `ForensicModel` classes.
2. Filtering out un-bound non-DB Pydantic models.
3. Attributing models to `wpostgresql`, `wsqlite`, `wredis`, `wtinydb`, etc.