const API_BASE = 'http://localhost:3001/api';

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('nexus_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      return auth.jwt || null;
    }
  } catch {}
  return null;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token) {
    // Try to refresh the token
    try {
      const stored = localStorage.getItem('nexus_auth');
      if (stored) {
        const auth = JSON.parse(stored);
        if (auth.refreshToken) {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: auth.refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            auth.jwt = data.token;
            auth.streamToken = data.streamToken;
            localStorage.setItem('nexus_auth', JSON.stringify(auth));
            // Retry original request
            headers['Authorization'] = `Bearer ${data.token}`;
            const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
            if (!retryRes.ok) throw new Error(`API error: ${retryRes.status}`);
            return retryRes.json();
          }
        }
      }
    } catch {}
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
