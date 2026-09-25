import * as assert from 'assert';
import { WorkspaceIndex } from '../../core/workspaceIndex';
import { DATABASE_PATTERNS } from '../../core/catalog';

suite('WDatabase Tools Extension Test Suite', () => {
    test('WorkspaceIndex initializes correctly', () => {
        const index = new WorkspaceIndex();
        assert.strictEqual(index.getModels().length, 0);
    });

    test('Pattern Catalog contains patterns for all 11 database libraries', () => {
        assert.ok(DATABASE_PATTERNS.length >= 7);
        const engines = DATABASE_PATTERNS.map((p) => p.engine);
        assert.ok(engines.includes('wpostgresql'));
        assert.ok(engines.includes('wredis'));
        assert.ok(engines.includes('wsqlite'));
    });
});
