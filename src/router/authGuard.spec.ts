import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/core/helpers', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  refreshtoken: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn()
}))

vi.mock('@/stores/snack', () => ({
  useSnackStore: () => ({
    showErrorSnack: vi.fn()
  })
}))

function b64url(obj: object): string {
  const s = JSON.stringify(obj)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeJwt(exp: number): string {
  return `eyJhbGciOiJIUzI1NiJ9.${b64url({ exp })}.sig`
}

describe('auth store guard helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('authGuardVerify is synchronous and false without a token', () => {
    const auth = useAuthStore()
    auth.authContext.token = null
    expect(auth.authGuardVerify()).toBe(false)
  })

  it('authGuardVerify is true when token exists and is not expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'))
    const auth = useAuthStore()
    const future = Math.floor(Date.now() / 1000) + 10_000
    auth.authContext.token = makeJwt(future)
    expect(auth.authGuardVerify()).toBe(true)
    vi.useRealTimers()
  })
})
