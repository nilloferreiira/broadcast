import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../../components/auth/LoginForm'

describe('LoginForm', () => {
  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/senha/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: 'user@test.com', password: '123456' }))
  })
  it('shows inline error for invalid email', async () => {
    render(<LoginForm onSubmit={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'not-email')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument())
  })
})
