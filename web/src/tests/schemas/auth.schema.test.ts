import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../../schemas/auth.schema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '123456' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-email', password: '123456' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('email')
  })
  it('rejects password < 6 chars', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '12345' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('password')
  })
})

describe('registerSchema', () => {
  it('rejects mismatched passwords', () => {
    const r = registerSchema.safeParse({ email: 'a@b.com', password: '123456', confirmPassword: 'other' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('confirmPassword')
  })
  it('accepts matching passwords', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '123456', confirmPassword: '123456' }).success).toBe(true)
  })
})
