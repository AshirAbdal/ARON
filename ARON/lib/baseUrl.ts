import { headers } from 'next/headers';

/**
 * Returns the base URL of the current request (e.g. http://localhost:3004).
 * Use this for server-side `fetch()` calls to internal API routes so the
 * storefront works regardless of which port `next dev` was started on.
 */
export function getBaseUrl(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}
