import { DBEngine } from './workspaceIndex';

export interface DatabasePattern {
    name: string;
    title: string;
    engine: DBEngine;
    description: string;
    snippet: string;
    category: 'CRUD' | 'Async' | 'Audit' | 'Backup' | 'Performance' | 'Search';
}

export const DATABASE_PATTERNS: DatabasePattern[] = [
    {
        name: 'wpostgresql_forensic_crud',
        title: 'WPostgreSQL Forensic Audit CRUD',
        engine: 'wpostgresql',
        description: 'Pydantic model inheriting from ForensicModel with status=99 soft delete and UTC audit tracking',
        category: 'Audit',
        snippet: `from wpostgresql import WPostgreSQL, ForensicModel

class Document(ForensicModel):
    id: int
    title: str

db = WPostgreSQL(Document, db_config)
db.insert(Document(id=1, title="Report"), user_id=42)
db.update(1, Document(id=1, title="Report V2"), user_id=99)
db.delete(1, user_id=777)  # soft-deletes setting status=99
records = db.get_all(include_deleted=True)`,
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
        name: 'wredis_key_value_cache',
        title: 'WRedis Key-Value Cache & Expiration',
        engine: 'wredis',
        description: 'Fast Key-Value storage with atomic counters and automatic TTL expiration',
        category: 'CRUD',
        snippet: `from wredis import WRedis

redis = WRedis(redis_config)
redis.set("user:session:100", {"role": "admin"}, ttl_seconds=3600)
session = redis.get("user:session:100")`,
    },
    {
        name: 'wsqlite_embedded_sync',
        title: 'WSQLite Embedded Local Persistence',
        engine: 'wsqlite',
        description: 'Lightweight SQLite ORM with automatic schema creation and local synchronization',
        category: 'CRUD',
        snippet: `from wsqlite import WSQLite
from pydantic import BaseModel

class LocalCache(BaseModel):
    id: int
    data: str

db = WSQLite(LocalCache, sqlite_config)
db.insert(LocalCache(id=1, data="temp_content"))`,
    },
    {
        name: 'wtinydb_json_document',
        title: 'WTinyDB JSON Document Store',
        engine: 'wtinydb',
        description: 'Pydantic-backed JSON document store for lightweight local settings',
        category: 'CRUD',
        snippet: `from wtinydb import WTinyDB
from pydantic import BaseModel

class AppSetting(BaseModel):
    key: str
    value: str

db = WTinyDB(AppSetting, "settings.json")
db.insert(AppSetting(key="theme", value="dark"))`,
    },
    {
        name: 'wmongo_bson_document',
        title: 'WMongo BSON Document Mapping',
        engine: 'wmongo',
        description: 'MongoDB document repository with Pydantic schema validation',
        category: 'CRUD',
        snippet: `from wmongo import WMongo
from pydantic import BaseModel

class LogDocument(BaseModel):
    event: str
    timestamp: str

db = WMongo(LogDocument, mongo_config)
db.insert(LogDocument(event="login", timestamp="2026-09-25T14:00:00Z"))`,
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
];
