import { describe, it, expect } from 'vitest'
import { contactSchema } from '../../schemas/contact.schema'

describe('contactSchema', () => {
  it('accepts valid contact', () => {
    expect(contactSchema.safeParse({ name: 'João', phone: '(11) 99999-9999' }).success).toBe(true)
  })
  it('rejects empty name', () => {
    const r = contactSchema.safeParse({ name: '', phone: '11999999999' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('name')
  })
  it('rejects phone < 8 chars', () => {
    const r = contactSchema.safeParse({ name: 'João', phone: '1234567' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('phone')
  })
  it('rejects phone with letters', () => {
    expect(contactSchema.safeParse({ name: 'João', phone: 'abc12345' }).success).toBe(false)
  })
})
