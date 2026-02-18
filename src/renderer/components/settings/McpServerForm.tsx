import { useState, useEffect } from 'react';
import { McpServerConfig, McpTransportType } from '../../../shared/types';

interface McpServerFormProps {
  initial?: McpServerConfig;
  onSave: (config: McpServerConfig) => void;
  onCancel: () => void;
  saving?: boolean;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e5e5ed',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#6b6b80',
  display: 'block',
  marginBottom: 4,
};

export default function McpServerForm({ initial, onSave, onCancel, saving }: McpServerFormProps) {
  const isEditing = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [id, setId] = useState(initial?.id || '');
  const [icon, setIcon] = useState(initial?.icon || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [transport, setTransport] = useState<McpTransportType>(initial?.transport || 'stdio');
  const [command, setCommand] = useState(initial?.command || '');
  const [args, setArgs] = useState(initial?.args?.join(', ') || '');
  const [envText, setEnvText] = useState(
    initial?.env ? Object.entries(initial.env).map(([k, v]) => `${k}=${v}`).join('\n') : ''
  );
  const [url, setUrl] = useState(initial?.url || '');
  const [headersText, setHeadersText] = useState(
    initial?.headers ? Object.entries(initial.headers).map(([k, v]) => `${k}=${v}`).join('\n') : ''
  );
  const [authType, setAuthType] = useState<'none' | 'oauth_client_credentials'>(initial?.authType || 'none');
  const [oauthClientId, setOauthClientId] = useState(initial?.oauthClientId || '');
  const [oauthClientSecret, setOauthClientSecret] = useState(initial?.oauthClientSecret || '');
  const [oauthScope, setOauthScope] = useState(initial?.oauthScope || '');

  useEffect(() => {
    if (!isEditing) {
      setId(slugify(name));
    }
  }, [name, isEditing]);

  const handleSubmit = () => {
    if (!name.trim() || !id.trim()) return;
    if (transport === 'stdio' && !command.trim()) return;
    if ((transport === 'sse' || transport === 'http') && !url.trim()) return;
    if ((transport === 'sse' || transport === 'http') && authType === 'oauth_client_credentials') {
      if (!oauthClientId.trim() || !oauthClientSecret.trim()) return;
    }

    const parseKV = (text: string): Record<string, string> => {
      const result: Record<string, string> = {};
      text.split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
          result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      });
      return result;
    };

    const config: McpServerConfig = {
      id: id.trim(),
      name: name.trim(),
      icon: icon.trim() || '🔌',
      description: description.trim(),
      transport,
      category: 'custom',
      isUserDefined: true,
    };

    if (transport === 'stdio') {
      config.command = command.trim();
      config.args = args.trim() ? args.split(',').map(a => a.trim()).filter(Boolean) : undefined;
      const env = parseKV(envText);
      config.env = Object.keys(env).length > 0 ? env : undefined;
    } else {
      config.url = url.trim();
      const headers = parseKV(headersText);
      config.headers = Object.keys(headers).length > 0 ? headers : undefined;
      config.authType = authType;
      if (authType === 'oauth_client_credentials') {
        config.oauthClientId = oauthClientId.trim();
        config.oauthClientSecret = oauthClientSecret.trim();
        config.oauthScope = oauthScope.trim() || undefined;
      }
    }

    onSave(config);
  };

  const transports: McpTransportType[] = ['stdio', 'sse', 'http'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
        {isEditing ? 'Edit Server' : 'Add Server'}
      </h4>

      {/* Name + Icon row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Server"
            style={inputStyle}
          />
        </div>
        <div style={{ width: 64 }}>
          <label style={labelStyle}>Icon</label>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="🔌"
            style={{ ...inputStyle, textAlign: 'center' }}
          />
        </div>
      </div>

      {/* ID (auto-generated, readonly when editing) */}
      <div>
        <label style={labelStyle}>ID {isEditing ? '(read-only)' : '(auto)'}</label>
        <input
          value={id}
          onChange={e => !isEditing && setId(e.target.value)}
          readOnly={isEditing}
          style={{
            ...inputStyle,
            fontFamily: 'monospace',
            background: isEditing ? '#f4f4f8' : undefined,
            color: isEditing ? '#9999aa' : undefined,
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description"
          style={inputStyle}
        />
      </div>

      {/* Transport toggle */}
      <div>
        <label style={labelStyle}>Transport *</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {transports.map(t => (
            <button
              key={t}
              onClick={() => setTransport(t)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: '1px solid ' + (transport === t ? '#6366f1' : '#e5e5ed'),
                background: transport === t ? '#ededf7' : '#fff',
                color: transport === t ? '#6366f1' : '#6b6b80',
                fontWeight: transport === t ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Transport-specific fields */}
      {transport === 'stdio' ? (
        <>
          <div>
            <label style={labelStyle}>Command *</label>
            <input
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="npx"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Arguments (comma-separated)</label>
            <input
              value={args}
              onChange={e => setArgs(e.target.value)}
              placeholder="tsx, path/to/server.ts"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Environment variables (KEY=value, one per line)</label>
            <textarea
              value={envText}
              onChange={e => setEnvText(e.target.value)}
              placeholder={"API_KEY=xxx\nDEBUG=true"}
              rows={3}
              style={{
                ...inputStyle,
                fontFamily: 'monospace',
                resize: 'vertical',
                minHeight: 60,
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label style={labelStyle}>URL *</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/mcp"
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Headers (KEY=value, one per line)</label>
            <textarea
              value={headersText}
              onChange={e => setHeadersText(e.target.value)}
              placeholder={"Authorization=Bearer xxx"}
              rows={3}
              style={{
                ...inputStyle,
                fontFamily: 'monospace',
                resize: 'vertical',
                minHeight: 60,
              }}
            />
          </div>

          {/* Authentication section */}
          <div>
            <label style={labelStyle}>Authentication</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['none', 'oauth_client_credentials'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAuthType(t)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: '1px solid ' + (authType === t ? '#6366f1' : '#e5e5ed'),
                    background: authType === t ? '#ededf7' : '#fff',
                    color: authType === t ? '#6366f1' : '#6b6b80',
                    fontWeight: authType === t ? 600 : 400,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t === 'none' ? 'None' : 'Client Credentials'}
                </button>
              ))}
            </div>
          </div>
          {authType === 'oauth_client_credentials' && (
            <>
              <div>
                <label style={labelStyle}>Client ID *</label>
                <input
                  value={oauthClientId}
                  onChange={e => setOauthClientId(e.target.value)}
                  placeholder="my-client-id"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Client Secret *</label>
                <input
                  type="password"
                  value={oauthClientSecret}
                  onChange={e => setOauthClientSecret(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Scope (optional)</label>
                <input
                  value={oauthScope}
                  onChange={e => setOauthScope(e.target.value)}
                  placeholder="read write"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: '1px solid #e5e5ed',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: '#6b6b80',
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            cursor: saving ? 'default' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
}
