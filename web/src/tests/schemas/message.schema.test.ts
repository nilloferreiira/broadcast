import { describe, it, expect } from 'vitest'
import { messageSchema } from '../../schemas/message.schema'

const future = new Date(Date.now() + 3_600_000)
const past = new Date(Date.now() - 3_600_000)

describe('messageSchema', () => {
  it('accepts immediate with past date', () => {
    expect(messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'immediate', sendAt: past }).success).toBe(true)
  })
  it('accepts scheduled with future date', () => {
    expect(messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'scheduled', sendAt: future }).success).toBe(true)
  })
  it('rejects scheduled with past date', () => {
    const r = messageSchema.safeParse({ body: 'Hi', contactIds: ['id1'], scheduleType: 'scheduled', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('sendAt')
  })
  it('rejects empty contactIds', () => {
    const r = messageSchema.safeParse({ body: 'Hi', contactIds: [], scheduleType: 'immediate', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('contactIds')
  })
  it('rejects empty body', () => {
    const r = messageSchema.safeParse({ body: '', contactIds: ['id1'], scheduleType: 'immediate', sendAt: past })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toContain('body')
  })
})
