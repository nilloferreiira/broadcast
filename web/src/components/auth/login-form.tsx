import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Alert } from '@mui/material'
import { loginSchema, type LoginForm } from '../../schemas/auth.schema'

interface LoginFormProps {
  onSubmit: (data: LoginForm) => Promise<void>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleSubmitWithError = async (data: LoginForm) => {
    try {
      await onSubmit(data)
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente." })
    }
  }

  return (
    <form data-slot="login-form" onSubmit={handleSubmit(handleSubmitWithError)} className="flex flex-col gap-4">
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
      <TextField
        label="Email"
        type="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Senha"
        type="password"
        error={!!errors.password}
        helperText={errors.password?.message}
        {...register('password')}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        className="focus-visible:outline-none focus-visible:ring-2"
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
