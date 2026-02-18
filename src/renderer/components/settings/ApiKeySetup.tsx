import { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { initClaudeService } from '../../services/claude-service';

export default function ApiKeySetup() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setApiKey = useAuthStore(s => s.setApiKey);

  const handleSubmit = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your API key');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with sk-ant-');
      return;
    }

    setLoading(true);
    setError('');

    try {
      initClaudeService(trimmed);
      await setApiKey(trimmed);
    } catch (err) {
      setError('Failed to save API key');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      className="fixed inset-0 bg-bg-main flex items-center justify-center z-[100]"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        zIndex: 100,
      }}
    >
      <div
        className="w-[440px] bg-bg-card rounded-2xl border border-border-default shadow-xl p-8"
        style={{
          width: 440,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e5ed',
          padding: 32,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
          }}>
            N
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', textAlign: 'center', marginBottom: 8 }}>
          Welcome to Nexus
        </h1>
        <p style={{ fontSize: 14, color: '#6b6b80', textAlign: 'center', marginBottom: 24 }}>
          Enter your Anthropic API key to get started with AI-powered conversations
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b6b80', marginBottom: 6 }}>
            Anthropic API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="sk-ant-..."
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #e5e5ed', background: '#f8f8fa',
              color: '#1a1a2e', fontSize: 14, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Setting up...' : 'Get Started'}
        </button>

        <p style={{ fontSize: 11, color: '#9999aa', textAlign: 'center', marginTop: 16 }}>
          Your API key is stored locally and never sent to our servers
        </p>
      </div>
    </div>
  );
}
