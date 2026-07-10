/**
 * Server-side fetch helper for the backend API.
 *
 * Public pages call this from Server Components so content is SEO-friendly and
 * driven by the admin panel. If the API is unreachable (e.g. during a build
 * with no backend running), it returns `null` and the page falls back to
 * bundled sample data instead of crashing the build.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function serverFetch<T>(
  path: string,
  { revalidate = 60 }: { revalidate?: number | false } = {},
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      ...(revalidate === false ? { cache: 'no-store' } : { next: { revalidate } }),
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data ?? null;
  } catch {
    // Backend down / network error → let the caller use its fallback.
    return null;
  }
}
