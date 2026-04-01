import { normalizeErrorToString, toUserFriendlyError } from '@/core/lib/error-message-map'

export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_ENDPOINT as string
  return path.startsWith('http') ? path : `${base}${path}`
}

type ApiJsonOptions = {
  method?: string
  token?: string
  body?: unknown
  cache?: RequestCache
  genericError: string
  /** When set, 401 responses try JSON `.error` first, else return this string (fromServer: false). */
  unauthorizedFallback?: string
}

/**
 * Shared JSON API fetch: credentials, JSON headers, consistent errors for !ok and network failures.
 */
export async function apiJsonFetch<T>(
  path: string,
  options: ApiJsonOptions
): Promise<T | { error: string; fromServer: boolean }> {
  const {
    method = 'GET',
    token,
    body,
    cache,
    genericError,
    unauthorizedFallback
  } = options

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      cache: cache ?? 'default',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }

  if (response.status === 404) {
    return {
      error: toUserFriendlyError(new Error(`404 Not Found: ${response.url}`)),
      fromServer: false
    }
  }

  if (response.status === 401 && unauthorizedFallback !== undefined) {
    try {
      const data: unknown = await response.json()
      if (data && typeof data === 'object' && 'error' in data && data.error != null) {
        return { error: normalizeErrorToString(data.error), fromServer: true }
      }
    } catch {
      /* empty body */
    }
    return { error: unauthorizedFallback, fromServer: false }
  }

  if (!response.ok) {
    try {
      const errData: unknown = await response.json()
      if (errData && typeof errData === 'object' && 'error' in errData && errData.error != null) {
        return { error: normalizeErrorToString(errData.error), fromServer: true }
      }
    } catch {
      /* empty body */
    }
    return {
      error:
        response.status >= 500
          ? 'The server could not be reached. Please try again.'
          : genericError,
      fromServer: false
    }
  }

  try {
    const data = (await response.json()) as T
    if (data === null || data === undefined) {
      return { error: genericError, fromServer: false }
    }
    return data
  } catch (err: unknown) {
    return { error: toUserFriendlyError(err), fromServer: false }
  }
}
