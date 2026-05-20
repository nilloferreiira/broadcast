import { describe, it, expect } from 'vitest'
import { connectionSchema } from '../../schemas/connection.schema'

describe('connectionSchema', () => {
  it('accepts valid name', () => {
    expect(connectionSchema.safeParse({ name: 'WhatsApp' }).success).toBe(true)
  })
  it('rejects empty name', () => {
    const r = connectionSchema.safeParse({ name: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('name')
  })
  it('rejects name > 50 chars', () => {
    expect(connectionSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false)
  })
})
