const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
).replace(/\/+$/, '');

export function getAuthToken() {
  if (typeof window === 'undefined') return null;

  // 1. ตรวจสอบจาก URL Search Params ทันที เผื่อเพิ่ง Redirect มาจาก OAuth
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramToken =
      urlParams.get('token') || urlParams.get('auth_token');
    if (paramToken) {
      localStorage.setItem('token', paramToken);
      localStorage.setItem('auth_token', paramToken);
      try {
        document.cookie = `auth_token=${encodeURIComponent(paramToken)}; path=/; max-age=604800; SameSite=Lax`;
      } catch {}
      return paramToken;
    }
  } catch {}

  // 2. อ่านจาก localStorage (รองรับทั้ง key 'token' และ 'auth_token')
  const local =
    localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (local) return local;

  // 3. อ่านจาก document.cookie เผื่อบันทึกผ่าน cookie
  try {
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {}

  return null;
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
    try {
      document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    try {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    } catch {}
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
  try {
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
  } catch {}
}

export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
