import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showDevPicker, setShowDevPicker] = useState(false);
  const [devName, setDevName] = useState('');

  useEffect(() => {
    // Listen for deep link auth callback
    const cleanup = window.nexus.auth.onAuthCallback((params) => {
      setLoggingIn(false);
      login(params);
    });
    return cleanup;
  }, [login]);

  const handleGoogleLogin = () => {
    setLoggingIn(true);
    window.nexus.auth.openLogin();
  };

  const handleGitHubLogin = () => {
    setLoggingIn(true);
    // Open GitHub OAuth in browser
    const w = window.open('http://localhost:3001/api/auth/github', '_blank');
    if (!w) {
      // Fallback to Electron shell
      window.nexus.auth.openLogin();
    }
  };

  const handleDevLogin = async (name: string, userId?: string) => {
    setLoggingIn(true);
    const uid = userId || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      const res = await fetch('http://localhost:3001/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: uid, email: `${uid}@nexus.app` }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data);
      } else {
        login({ userId: uid, email: `${uid}@nexus.app`, name, avatar: '', token: '', refreshToken: '', streamToken: '' });
      }
    } catch {
      login({ userId: uid, email: `${uid}@nexus.app`, name, avatar: '', token: '', refreshToken: '', streamToken: '' });
    }
    setLoggingIn(false);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f8fa 0%, #ededf7 100%)',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 400,
        padding: 40,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 20px',
        }}>
          N
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
          Welcome to Nexus
        </h1>
        <p style={{ fontSize: 14, color: '#9999aa', margin: '0 0 32px' }}>
          AI-powered chat meets team collaboration
        </p>

        {loggingIn ? (
          <div style={{ padding: 20, color: '#9999aa', fontSize: 14 }}>
            Waiting for authentication...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleGoogleLogin}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '12px 0', borderRadius: 10,
                border: '1px solid #e5e5ed', background: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, color: '#1a1a2e',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#f8f8fa')}
              onMouseOut={e => (e.currentTarget.style.background = '#fff')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={handleGitHubLogin}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '12px 0', borderRadius: 10,
                border: '1px solid #e5e5ed', background: '#1a1a2e', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, color: '#fff',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#2a2a44')}
              onMouseOut={e => (e.currentTarget.style.background = '#1a1a2e')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e5ed' }} />
              <span style={{ fontSize: 12, color: '#9999aa' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e5ed' }} />
            </div>

            {!showDevPicker ? (
              <button
                onClick={() => setShowDevPicker(true)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10,
                  border: '1px solid #e5e5ed', background: '#fff', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: '#9999aa',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#f8f8fa')}
                onMouseOut={e => (e.currentTarget.style.background = '#fff')}
              >
                Continue as Dev User
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8f8fa', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#9999aa', marginBottom: 4 }}>Pick a dev user:</div>
                {[
                  { name: 'Alice', id: 'dev-alice' },
                  { name: 'Bob', id: 'dev-bob' },
                  { name: 'Charlie', id: 'dev-charlie' },
                ].map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleDevLogin(u.name, u.id)}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 8,
                      border: '1px solid #e5e5ed', background: '#fff', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, color: '#1a1a2e',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#ededf7')}
                    onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                  >
                    {u.name}
                  </button>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    value={devName}
                    onChange={e => setDevName(e.target.value)}
                    placeholder="Custom name..."
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #e5e5ed', fontSize: 13, outline: 'none',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && devName.trim()) handleDevLogin(devName.trim()); }}
                  />
                  <button
                    onClick={() => devName.trim() && handleDevLogin(devName.trim())}
                    disabled={!devName.trim()}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none',
                      background: devName.trim() ? '#6366f1' : '#e5e5ed',
                      color: devName.trim() ? '#fff' : '#9999aa',
                      cursor: devName.trim() ? 'pointer' : 'default',
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    Go
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
