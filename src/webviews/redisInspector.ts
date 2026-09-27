import * as vscode from 'vscode';

export interface RedisKeyItem {
    key: string;
    type: 'string' | 'hash' | 'list' | 'set' | 'zset';
    ttl: number; // seconds, -1 if no TTL, -2 if expired
    memoryBytes: number;
    value: any;
}

export class RedisInspectorPanel {
    public static currentPanel: RedisInspectorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private _keys: RedisKeyItem[] = [
        { key: 'user:session:1001', type: 'hash', ttl: 3420, memoryBytes: 240, value: { user_id: '1001', role: 'admin', ip: '127.0.0.1' } },
        { key: 'cache:query:top_sales', type: 'string', ttl: 180, memoryBytes: 1024, value: '[{"id":1,"amount":99.50},{"id":2,"amount":45.20}]' },
        { key: 'rate_limit:ip:192.168.1.50', type: 'string', ttl: 45, memoryBytes: 64, value: '18' },
        { key: 'queue:email_notifications', type: 'list', ttl: -1, memoryBytes: 512, value: ['welcome_user_1001', 'password_reset_user_99'] },
        { key: 'active_sessions_zset', type: 'zset', ttl: -1, memoryBytes: 384, value: [{ member: 'user_1001', score: 1727464000 }] },
        { key: 'lock:wpipe_batch_ingest', type: 'string', ttl: 12, memoryBytes: 48, value: 'token-uuid-machine-salted-99' }
    ];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getHtmlForWebview();

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'refresh':
                        this._postState();
                        return;
                    case 'updateTTL':
                        const target = this._keys.find(k => k.key === message.key);
                        if (target) {
                            target.ttl = parseInt(message.newTTL, 10);
                            vscode.window.showInformationMessage(`⏱️ TTL updated for '${message.key}' to ${target.ttl}s.`);
                            this._postState();
                        }
                        return;
                    case 'deleteKey':
                        this._keys = this._keys.filter(k => k.key !== message.key);
                        vscode.window.showInformationMessage(`🗑️ Deleted Redis key '${message.key}'.`);
                        this._postState();
                        return;
                    case 'addKey':
                        this._keys.unshift({
                            key: message.key,
                            type: message.type,
                            ttl: parseInt(message.ttl, 10) || -1,
                            memoryBytes: 128,
                            value: message.value
                        });
                        vscode.window.showInformationMessage(`✨ Added Redis key '${message.key}'.`);
                        this._postState();
                        return;
                }
            },
            null,
            this._disposables
        );

        this._postState();
    }

    public static createOrShow() {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (RedisInspectorPanel.currentPanel) {
            RedisInspectorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'wdatabaseRedisInspector',
            '🔴 WRedis Commander & Live TTL Monitor',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        RedisInspectorPanel.currentPanel = new RedisInspectorPanel(panel);
    }

    private _postState() {
        this._panel.webview.postMessage({
            command: 'updateKeys',
            keys: this._keys
        });
    }

    public dispose() {
        RedisInspectorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WRedis Key Inspector</title>
    <style>
        body { font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 15px; margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; margin-bottom: 15px; }
        .search-box { display: flex; gap: 10px; margin-bottom: 15px; }
        input, select, button { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 7px 10px; border-radius: 4px; font-family: inherit; }
        button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; border: none; font-weight: bold; }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-danger:hover { background: #c0392b; }
        .container { display: flex; gap: 20px; height: calc(100vh - 140px); }
        .sidebar { width: 40%; border-right: 1px solid var(--vscode-widget-border); padding-right: 15px; overflow-y: auto; }
        .detail { width: 60%; padding-left: 5px; overflow-y: auto; }
        .key-item { padding: 8px 12px; border: 1px solid var(--vscode-widget-border); border-radius: 4px; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .key-item:hover, .key-item.selected { background: var(--vscode-editor-lineHighlightBackground); border-color: var(--vscode-focusBorder); }
        .badge { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
        .badge-string { background: #3498db; color: white; }
        .badge-hash { background: #9b59b6; color: white; }
        .badge-list { background: #e67e22; color: white; }
        .badge-zset { background: #2ecc71; color: white; }
        .ttl-bar { width: 100%; background: #333; height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden; }
        .ttl-fill { height: 100%; background: #2ecc71; transition: width 0.5s; }
        pre { background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
        .modal { background: var(--vscode-editor-lineHighlightBackground); border: 1px solid var(--vscode-widget-border); padding: 12px; border-radius: 6px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🔴 WRedis Commander & Realtime TTL Monitor</h2>
        <div>
            <button onclick="toggleNewKeyModal()">➕ New Key</button>
            <button onclick="refreshKeys()">🔄 Refresh</button>
        </div>
    </div>

    <div id="newKeyModal" style="display:none;" class="modal">
        <h4>Create New Redis Key</h4>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="text" id="newKeyName" placeholder="Key name (e.g. cache:config)">
            <select id="newKeyType">
                <option value="string">string</option>
                <option value="hash">hash</option>
                <option value="list">list</option>
                <option value="zset">zset</option>
            </select>
            <input type="number" id="newKeyTTL" placeholder="TTL (seconds, -1=none)" value="-1" style="width: 130px;">
        </div>
        <textarea id="newKeyValue" style="width: 100%; height: 60px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 6px; border-radius: 4px; font-family: monospace;" placeholder='Value (string or JSON)'></textarea>
        <div style="margin-top: 8px;">
            <button onclick="submitNewKey()">Save Key</button>
            <button onclick="toggleNewKeyModal()" style="background: transparent; border: 1px solid var(--vscode-input-border);">Cancel</button>
        </div>
    </div>

    <div class="search-box">
        <input type="text" id="searchFilter" placeholder="Filter keys by pattern (e.g. user:*, cache:*)" oninput="renderKeyList()" style="flex: 1;">
    </div>

    <div class="container">
        <div class="sidebar" id="keyList"></div>
        <div class="detail" id="keyDetail">
            <p style="color: var(--vscode-descriptionForeground);">Select a key to view value, memory profiling, and TTL management.</p>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let allKeys = [];
        let selectedKey = null;

        function refreshKeys() {
            vscode.postMessage({ command: 'refresh' });
        }

        function toggleNewKeyModal() {
            const m = document.getElementById('newKeyModal');
            m.style.display = m.style.display === 'none' ? 'block' : 'none';
        }

        function submitNewKey() {
            const key = document.getElementById('newKeyName').value.trim();
            const type = document.getElementById('newKeyType').value;
            const ttl = document.getElementById('newKeyTTL').value;
            const valRaw = document.getElementById('newKeyValue').value;
            if (!key) return alert('Key name is required');
            let value = valRaw;
            try { value = JSON.parse(valRaw); } catch(e) {}
            vscode.postMessage({ command: 'addKey', key, type, ttl, value });
            toggleNewKeyModal();
        }

        function selectKey(k) {
            selectedKey = k;
            renderKeyList();
            renderKeyDetail();
        }

        function renderKeyList() {
            const filter = document.getElementById('searchFilter').value.toLowerCase();
            const filtered = allKeys.filter(k => k.key.toLowerCase().includes(filter));
            const listEl = document.getElementById('keyList');

            if (filtered.length === 0) {
                listEl.innerHTML = '<p style="color: var(--vscode-descriptionForeground);">No keys found.</p>';
                return;
            }

            let html = '';
            filtered.forEach(k => {
                const isSel = selectedKey && selectedKey.key === k.key;
                const badgeClass = 'badge badge-' + k.type;
                const ttlLabel = k.ttl === -1 ? '∞ No Expiry' : (k.ttl + 's');
                const ttlPercent = k.ttl > 0 ? Math.min(100, Math.max(10, (k.ttl / 3600) * 100)) : 100;
                const ttlColor = k.ttl > 0 && k.ttl < 60 ? '#e74c3c' : '#2ecc71';

                html += '<div class="key-item ' + (isSel ? 'selected' : '') + '" onclick="selectKey(' + JSON.stringify(k).replace(/"/g, '&quot;') + ')">' +
                    '<div><strong>' + k.key + '</strong><br><small style="color:var(--vscode-descriptionForeground);">' + k.memoryBytes + ' B | TTL: ' + ttlLabel + '</small></div>' +
                    '<span class="' + badgeClass + '">' + k.type.toUpperCase() + '</span>' +
                '</div>';
            });
            listEl.innerHTML = html;
        }

        function renderKeyDetail() {
            const d = document.getElementById('keyDetail');
            if (!selectedKey) {
                d.innerHTML = '<p style="color: var(--vscode-descriptionForeground);">Select a key to view value, memory profiling, and TTL management.</p>';
                return;
            }

            const valStr = typeof selectedKey.value === 'object' ? JSON.stringify(selectedKey.value, null, 2) : selectedKey.value;
            const ttlDisplay = selectedKey.ttl === -1 ? 'None (Persistent Key)' : selectedKey.ttl + ' seconds remaining';

            d.innerHTML = '<h3>Key: <code>' + selectedKey.key + '</code></h3>' +
                '<p><strong>Type:</strong> <span class="badge badge-' + selectedKey.type + '">' + selectedKey.type.toUpperCase() + '</span> | <strong>Memory:</strong> ' + selectedKey.memoryBytes + ' bytes</p>' +
                '<p><strong>TTL:</strong> ' + ttlDisplay + '</p>' +
                '<div style="display:flex; gap: 8px; margin-bottom: 12px;">' +
                    '<input type="number" id="ttlInput" placeholder="New TTL (sec, -1 to persist)" style="width: 180px;">' +
                    '<button onclick="changeTTL()">Update TTL</button>' +
                    '<button class="btn-danger" onclick="deleteCurrentKey()">Delete Key</button>' +
                '</div>' +
                '<h4>Value Inspector:</h4>' +
                '<pre><code>' + valStr + '</code></pre>';
        }

        function changeTTL() {
            const newTTL = document.getElementById('ttlInput').value;
            if (!newTTL) return;
            vscode.postMessage({ command: 'updateTTL', key: selectedKey.key, newTTL });
        }

        function deleteCurrentKey() {
            if (confirm('Are you sure you want to delete key: ' + selectedKey.key + '?')) {
                vscode.postMessage({ command: 'deleteKey', key: selectedKey.key });
                selectedKey = null;
                renderKeyDetail();
            }
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateKeys') {
                allKeys = message.keys;
                if (selectedKey) {
                    selectedKey = allKeys.find(k => k.key === selectedKey.key) || null;
                }
                renderKeyList();
                renderKeyDetail();
            }
        });
    </script>
</body>
</html>`;
    }
}
