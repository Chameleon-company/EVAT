export async function fetchJson(path, { method='GET', headers={}, body, signal } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const h = { 'Content-Type': 'application/json', ...headers };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${base}${path}`, {
      method, headers: h, body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal, credentials: 'include'
    });
    if (!res.ok) {
      const txt = await res.text().catch(()=> '');
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
    }
    return await res.json();
  } finally { clearTimeout(t); }
}
