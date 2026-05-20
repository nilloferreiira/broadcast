import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionForm } from '../../../components/connections/ConnectionForm'

describe('ConnectionForm', () => {
  it('calls onSubmit with name', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ConnectionForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/nome/i), 'WhatsApp')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'WhatsApp' }))
  })
  it('shows error for empty name', async () => {
    render(<ConnectionForm onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument())
  })
  it('pre-fills defaultValues when editing', () => {
    render(<ConnectionForm onSubmit={vi.fn()} defaultValues={{ name: 'Old Name' }} />)
    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument()
  })
})
