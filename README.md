<p align="center">
  <a href="https://open-vsx.org/extension/wisrovi/wdatabase-vscode"><img src="https://img.shields.io/badge/Open%20VSX-v1.6.0-blue?style=for-the-badge&logo=visualstudiocode" alt="Open VSX" /></a>
  <a href="https://linkedin.com/in/wisrovi-rodriguez"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://wisrovi.dev"><img src="https://img.shields.io/badge/Author-wisrovi.dev-111827?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portal" /></a>
  <a href="https://orcid.org/0009-0005-0710-1861"><img src="https://img.shields.io/badge/ORCID-0009--0005--0710--1861-A6CE39?style=for-the-badge&logo=orcid&logoColor=white" alt="ORCID" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
</p>

# 🗄️ WDatabase Tools for VS Code & Antigravity IDE (`wdatabase-vscode`)

**WDatabase Tools** is the intelligent control suite & visual IDE extension for the `w` database library ecosystem (`wpostgresql`, `wredis`, `wsqlite`, `wclickhouse`, `wmongo`, `wtinydb`, `wmysql`, `wmariadb`, `wElasticsearch`, `wdatabricks`, `wSnowflake`, and `wauth`).

## 🌟 Key Features (v1.6.0 Architecture & Forensic Suite)

- **🛡️ Time-Machine Forensic Diff & Restore (`status=99`)**: Visor visual interactivo lado a lado para auditar registros con borrado lógico (`ForensicModel`), comparar versiones (`forensic_version`), rastrear quién ejecutó el borrado y restaurar el registro al estado activo (`status=1`) con 1 clic.
- **⚡ Live Query Linting & Anti-Pattern Diagnostics**: Analizador sintáctico en tiempo real en archivos Python: detecta riesgos de **SQL Injection** en f-strings, alertas de **`SELECT *` sin LIMIT** en tablas masivas y detección de antipatrón **N+1 queries** en bucles `for`.
- **📑 Automated Data Dictionary Generator**: Comando `wdatabase.exportDataDictionary` para generar documentación técnica completa `DATABASE_SCHEMA.md` con especificaciones de columnas, tipos, restricciones y DDLs.
- **🔀 Cross-Engine Data Migration Pipeline Wizard**: Asistente interactivo para generar pipelines de sincronización y migración por lotes basados en `wpipe` entre cualquier par de motores (ej. `wsqlite` ➔ `wpostgresql` o `wpostgresql` ➔ `wclickhouse`).
- **📊 Visual Data Grid con Edición Inline & CRUD In-Situ**: Haz doble clic en cualquier celda para modificar valores numéricos o texto y confirmar cambios atómicos directamente contra la base de datos.
- **🔴 WRedis Commander & Live TTL Monitor**: Explorador visual dedicado para Redis con inspección de tipos (string, hash, list, set, zset), editor y profilado de memoria (`memoryBytes`), y gestión interactiva de TTL.
- **📈 Analytical Metric & Time-Series Visualizer**: Gráficos analíticos embebidos para consultas de ClickHouse y series de tiempo con histogramas de latencia y distribuciones porcentuales.
- **🕒 Historial de Consultas & Safe Audit Log**: Registro persistente de las últimas 50 consultas con tiempos de respuesta en milisegundos, conteo de filas y recarga instantánea en el editor con 1 clic.
- **🤖 AI Text-to-Query Assistant**: Translate natural language prompts directly into optimized SQL (PostgreSQL, SQLite, ClickHouse, MySQL) or NoSQL (MongoDB, Redis) within the Query Playground.
- **🔍 Live Schema Drift Detector & Healer**: Introspect live database tables against in-memory Pydantic models, detect missing columns or type mismatches, and generate 1-click self-healing DDL migrations.
- **⚡ Query Profiling & EXPLAIN Plan Visualizer**: Inspect execution plans and receive intelligent index recommendations directly from the playground.
- **📦 Multi-Format Data Exporter**: Export queried datasets to JSON, CSV, transactional SQL Dumps, or Apache Arrow / Parquet metadata schemas.
- **Zero-Noise DB-Binding Engine**: Automatically distinguishes Pydantic models bound to database repositories from plain API schemas or settings.
- **🔐 WAuth Secret Vault Explorer**: Visual sidebar panel to inspect, toggle reveal, encrypt, and manage machine-salted AES-256 Fernet secrets in `secrets.db`.
- **🔄 Database Reverse Engineering**: Introspect existing live database schemas (PostgreSQL, SQLite, ClickHouse, MySQL) and generate corresponding Pydantic v2 and `ForensicModel` classes in one click.
- **🐳 Local Database Container Orchestrator**: Spin up ephemeral, isolated development containers (PostgreSQL, Redis Stack, ClickHouse, Mongo) directly from the IDE.
- **🧪 1-Click Pytest Test Runner**: CodeLens action `[$(play) Run Tests]` and command palette to execute integration test suites directly in the integrated terminal.
- **🚀 WPipe Pipeline Integration**: Instantly generate class-based `@step` ingestion and audit components from any Pydantic database model via CodeLens.
- **🌱 Synthetic Seed & Mock Data Generator**: Generates realistic synthetic mock data scripts to populate development databases in seconds.
- **Interactive ERD Diagram Visualizer**: Generates dynamic Mermaid Entity-Relationship Diagrams with one-click clipboard copying and export.

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

---

## 👤 Autor & Afiliación Oficial

* **William Steve Rodriguez Villamizar (Wisrovi)**
* **Cargo:** Principal AI Engineer & Applied AI Solutions Architect | Scientific Researcher
* 📧 **Email:** [wisrovi.rodriguez@gmail.com](mailto:wisrovi.rodriguez@gmail.com)
* 🌐 **Portal Oficial:** [wisrovi.dev](https://wisrovi.dev)
* 💼 **LinkedIn:** [wisrovi-rodriguez](https://www.linkedin.com/in/wisrovi-rodriguez/)
* 🆔 **ORCID:** [0009-0005-0710-1861](https://orcid.org/0009-0005-0710-1861)
* 📦 **PyPI:** [pypi.org/user/wisrovi/](https://pypi.org/user/wisrovi/)
* 🐙 **GitHub:** [@wisrovi](https://github.com/wisrovi)
