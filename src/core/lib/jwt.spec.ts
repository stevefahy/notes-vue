import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isJwtExpired } from './jwt'

function b64url(obj: object): string {
  const s = JSON.stringify(obj)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeJwt(exp: number): string {
  return `eyJhbGciOiJIUzI1NiJ9.${b64url({ exp })}.sig`
}

describe('isJwtExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('treats null, undefined, and empty as expired', () => {
    expect(isJwtExpired(null)).toBe(true)
    expect(isJwtExpired(undefined)).toBe(true)
    expect(isJwtExpired('')).toBe(true)
  })

  it('treats malformed JWT as expired', () => {
    expect(isJwtExpired('not-a-jwt')).toBe(true)
    expect(isJwtExpired('a.b')).toBe(true)
    expect(isJwtExpired('onlyone')).toBe(true)
  })

  it('returns false when exp is in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    expect(isJwtExpired(makeJwt(future))).toBe(false)
  })

  it('returns true when exp is in the past', () => {
    const past = Math.floor(Date.now() / 1000) - 60
    expect(isJwtExpired(makeJwt(past))).toBe(true)
  })
})
