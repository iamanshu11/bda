/**
 * Convert a YouTube watch/share URL into an embed URL.
 * Returns null if it can't be parsed (caller can fall back to a raw iframe).
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/embed/')[1];
    else id = u.searchParams.get('v') ?? '';
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
