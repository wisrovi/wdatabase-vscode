import { DBEngine } from './workspaceIndex';

export interface DatabasePattern {
    name: string;
    title: string;
    engine: DBEngine;
    description: string;
    snippet: string;
    category: 'CRUD' | 'Async' | 'Audit' | 'Backup' | 'Performance' | 'Search' | 'Security';
}

export const DATABASE_PATTERNS: DatabasePattern[] = [
    // 1. WPostgreSQL
    {
        name: 'wpostgresql_forensic_crud',
        title: 'WPostgreSQL Forensic Audit CRUD',
        engine: 'wpostgresql',
        description: 'Pydantic model inheriting from ForensicModel with status=99 soft delete and UTC audit tracking',
        category: 'Audit',
        snippet: `from wpostgresql import WPostgreSQL, ForensicModel
from pydantic import Field

class Document(ForensicModel):
    id: int = Field(description="Primary Key")
    title: str = Field(description="NOT NULL")

db = WPostgreSQL(Document, db_config)
db.insert(Document(id=1, title="Q3 Report"), user_id=42)
db.update(1, Document(id=1, title="Q3 Report V2"), user_id=99)
db.delete(1, user_id=777)  # Forensic soft-delete sets status=99
records = db.get_all(include_deleted=False)`,
    },
    {
        name: 'wpostgresql_async_paginated',
        title: 'WPostgreSQL Async Paginated Query',
        engine: 'wpostgresql',
        description: 'Asynchronous page-based retrieval with ordering and limit/offset',
        category: 'Async',
        snippet: `page = await db.get_page_async(page=1, per_page=25)
ordered = await db.get_paginated_async(limit=10, offset=0, order_by="id", order_desc=True)`,
    },
    {
        name: 'wpostgresql_sqlite_backup',
        title: 'WPostgreSQL to WSQLite Backup',
        engine: 'wpostgresql',
        description: 'Export PostgreSQL tables directly into an SQLite backup file',
        category: 'Backup',
        snippet: `from wpostgresql import backup_db_to_sqlite

models = [User, Order]
results = backup_db_to_sqlite(models, db_config, "backup.db")`,
    },

    // 2. WSQLite
    {
        name: 'wsqlite_embedded_sync',
        title: 'WSQLite Reactive TableSync & WAL Multithreading',
        engine: 'wsqlite',
        description: 'SQLite ORM with automatic schema creation, composite unique keys and thread-safe WAL mode',
        category: 'CRUD',
        snippet: `from wsqlite import WSQLite
from pydantic import BaseModel, Field

class CacheItem(BaseModel):
    key: str = Field(description="Primary Key")
    value: str = Field(description="NOT NULL")

db = WSQLite(CacheItem, {"db_path": "./app_data.db"})
db.insert(CacheItem(key="session:1", value="active"))
item = db.get_by_id("session:1")`,
    },
    {
        name: 'wsqlite_async_crud',
        title: 'WSQLite Async High-Performance CRUD',
        engine: 'wsqlite',
        description: 'Async connection pool execution for high-throughput local persistence',
        category: 'Async',
        snippet: `await db.insert_async(CacheItem(key="session:2", value="active"))
res = await db.get_all_async()`,
    },

    // 3. WRedis
    {
        name: 'wredis_key_value_cache',
        title: 'WRedis Ultra-Fast Cache & Expiration',
        engine: 'wredis',
        description: 'Fast Key-Value storage with atomic counters and automatic TTL expiration',
        category: 'CRUD',
        snippet: `from wredis import WRedis

redis = WRedis({"host": "localhost", "port": 6379, "db": 0})
redis.set("user:session:100", {"role": "admin"}, ttl_seconds=3600)
session = redis.get("user:session:100")`,
    },
    {
        name: 'wredis_distributed_lock',
        title: 'WRedis Atomic Distributed Lock',
        engine: 'wredis',
        description: 'Acquire high-concurrency distributed locks with automatic release and timeout protection',
        category: 'Performance',
        snippet: `from wredis import WRedis

redis = WRedis({"host": "localhost", "port": 6379})
with redis.lock("process_batch_mutex", timeout=10):
    # Critical section protected against concurrent execution
    pass`,
    },
    {
        name: 'wredis_cache_decorator',
        title: 'WRedis Cache Decorator (@cache)',
        engine: 'wredis',
        description: 'Automatic function memoization in Redis with telemetry and configurable TTL',
        category: 'Performance',
        snippet: `from wredis import cache

@cache(ttl_seconds=300, key_prefix="calc_metric")
def compute_heavy_analytics(metric_id: str):
    return {"result": 42}`,
    },

    // 4. WClickHouse
    {
        name: 'wclickhouse_arrow_bulk',
        title: 'WClickHouse Apache Arrow Columnar Ingestion',
        engine: 'wclickhouse',
        description: 'Massive columnar ingestion via PyArrow buffers for OLAP streaming',
        category: 'Performance',
        snippet: `from wclickhouse import WClickHouse
from pydantic import BaseModel
from datetime import datetime

class SensorTelemetry(BaseModel):
    sensor_id: str
    temperature: float
    recorded_at: datetime

db = WClickHouse(SensorTelemetry, db_config)
# Bulk insert millions of rows with minimal memory footprint
db.insert_arrow(arrow_table)`,
    },
    {
        name: 'wclickhouse_dataframe_bulk',
        title: 'WClickHouse Pandas DataFrame Direct Insert',
        engine: 'wclickhouse',
        description: 'Zero-loop high-speed ingestion directly from Pandas DataFrames into ClickHouse tables',
        category: 'Performance',
        snippet: `db.insert_dataframe(df_events, batch_size=50000)`,
    },

    // 5. WMongo
    {
        name: 'wmongo_bson_document',
        title: 'WMongo BSON Document Mapping & Redis Cache',
        engine: 'wmongo',
        description: 'MongoDB document repository with Pydantic schema validation and integrated cache layer',
        category: 'CRUD',
        snippet: `from wmongo import WMongo
from pydantic import BaseModel

class LogDocument(BaseModel):
    event: str
    timestamp: str

db = WMongo(LogDocument, mongo_config)
db.insert(LogDocument(event="login", timestamp="2026-09-27T20:00:00Z"))`,
    },

    // 6. WTinyDB
    {
        name: 'wtinydb_json_document',
        title: 'WTinyDB JSON Document Store',
        engine: 'wtinydb',
        description: 'Pydantic-backed JSON document store for lightweight local settings and configurations',
        category: 'CRUD',
        snippet: `from wtinydb import WTinyDB
from pydantic import BaseModel

class AppSetting(BaseModel):
    key: str
    value: str

db = WTinyDB(AppSetting, "settings.json")
db.insert(AppSetting(key="theme", value="dark"))`,
    },

    // 7. WMySQL & WMariaDB
    {
        name: 'wmysql_crud_repository',
        title: 'WMySQL Connection-Pooled Relational CRUD',
        engine: 'wmysql',
        description: 'Relational repository pattern with connection pooling and schema auto-creation',
        category: 'CRUD',
        snippet: `from wmysql import WMySQL
from pydantic import BaseModel

class Account(BaseModel):
    account_id: int
    balance: float

db = WMySQL(Account, mysql_config)
db.insert(Account(account_id=1, balance=500.0))`,
    },
    {
        name: 'wmariadb_async_pool',
        title: 'WMariaDB Async Connection Pooler',
        engine: 'wmariadb',
        description: 'High-concurrency MariaDB driver with ACID transaction isolation',
        category: 'Async',
        snippet: `from wmariadb import WMariaDB

db = WMariaDB(Account, mariadb_config)
records = await db.get_all_async()`,
    },

    // 8. WElasticsearch
    {
        name: 'welasticsearch_fuzzy_search',
        title: 'WElasticsearch Full-Text Search & Lucene Queries',
        engine: 'wElasticsearch',
        description: 'Semantic vector search, fuzzy matching, and real-time document indexing',
        category: 'Search',
        snippet: `from wElasticsearch import WElasticsearch
from pydantic import BaseModel

class ArticleIndex(BaseModel):
    title: str
    content: str

es = WElasticsearch(ArticleIndex, es_config)
results = es.search("machine learning optimization", fuzziness="AUTO")`,
    },

    // 9. Cloud Enterprise OLAP (WDatabricks & WSnowflake)
    {
        name: 'wdatabricks_delta_lake',
        title: 'WDatabricks Delta Lake Table Management',
        engine: 'wdatabricks',
        description: 'PySpark and Delta Lake table queries with schema enforcement',
        category: 'Performance',
        snippet: `from wdatabricks import WDatabricks

db = WDatabricks(DeltaModel, databricks_config)
df = db.query_delta("SELECT * FROM silver_lake.events WHERE event_date = CURRENT_DATE()")`,
    },
    {
        name: 'wsnowflake_warehouse_query',
        title: 'WSnowflake Data Cloud Warehouse Analytics',
        engine: 'wSnowflake',
        description: 'Serverless analytical SQL querying with OAuth2 and key-pair authentication',
        category: 'Performance',
        snippet: `from wSnowflake import WSnowflake

db = WSnowflake(AnalyticsModel, snowflake_config)
results = db.fetch_all("SELECT count(*) FROM analytics.bi.active_users")`,
    },

    // 10. WAuth Security Integration
    {
        name: 'wauth_secure_credentials_vault',
        title: 'WAuth Salted Credentials Vault for Database Passwords',
        engine: 'wpostgresql',
        description: 'Secure AES-256 Fernet salted machine storage to eliminate plaintext database passwords',
        category: 'Security',
        snippet: `from wauth import WAuth
from wpostgresql import WPostgreSQL

vault = WAuth(db_path="./secrets.db")
db_password = vault.get("PROD_POSTGRES_PWD")

db_config = {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": db_password,
    "dbname": "enterprise_db"
}`,
    }
];
