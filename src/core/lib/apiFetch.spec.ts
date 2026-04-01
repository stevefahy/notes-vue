import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiUrl, apiJsonFetch } from './apiFetch'

describe('apiUrl', () => {
  it('concatenates VITE_API_ENDPOINT with path', () => {
    vi.stubEnv('VITE_API_ENDPOINT', 'http://localhost:5000/')
    expect(apiUrl('api/data/notebooks')).toBe('http://localhost:5000/api/data/notebooks')
  })
})

describe('apiJsonFetch', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_ENDPOINT', 'http://localhost:5000/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns parsed JSON on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true, token: 't', details: {} })
      })
    )

    const result = await apiJsonFetch<{ success: boolean }>('api/auth/login', {
      method: 'POST',
      body: { email: 'a', password: 'b' },
      genericError: 'fail',
      unauthorizedFallback: 'fail'
    })

    expect(result).toEqual({ success: true, token: 't', details: {} })
  })

  it('maps 401 with unauthorizedFallback when body has no error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({})
      })
    )

    const result = await apiJsonFetch('api/auth/login', {
      method: 'POST',
      genericError: 'generic',
      unauthorizedFallback: 'bad creds'
    })

    expect(result).toEqual({ error: 'bad creds', fromServer: false })
  })
})
