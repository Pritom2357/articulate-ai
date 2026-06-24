const CACHE_PREFIX = 'audio_v1_';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function urlKey(url) {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  }
  return CACHE_PREFIX + Math.abs(h).toString(36);
}

function getFromCache(url) {
  try {
    const raw = localStorage.getItem(urlKey(url));
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(urlKey(url));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function evictOldest() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(CACHE_PREFIX)) continue;
    try {
      const { expiresAt } = JSON.parse(localStorage.getItem(k));
      entries.push({ key: k, expiresAt });
    } catch {
      localStorage.removeItem(k);
    }
  }
  entries.sort((a, b) => a.expiresAt - b.expiresAt);
  entries.slice(0, Math.ceil(entries.length / 2)).forEach(e => localStorage.removeItem(e.key));
}

function setInCache(url, dataUrl) {
  const key = urlKey(url);
  const entry = JSON.stringify({ data: dataUrl, expiresAt: Date.now() + TTL_MS });
  try {
    localStorage.setItem(key, entry);
  } catch {
    evictOldest();
    try { localStorage.setItem(key, entry); } catch { /* quota still full, skip silently */ }
  }
}

export async function fetchAndCacheAudio(url) {
  const cached = getFromCache(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Audio fetch failed: ${res.status}`);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setInCache(url, reader.result);
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
