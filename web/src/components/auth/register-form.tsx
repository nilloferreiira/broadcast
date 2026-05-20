import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Alert } from '@mui/material'
import { registerSchema, type RegisterForm } from '../../schemas/auth.schema'

interface RegisterFormProps {
  onSubmit: (data: RegisterForm) => Promise<void>
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const handleSubmitWithError = async (data: RegisterForm) => {
    try {
      await onSubmit(data)
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente." })
    }
  }

  return (
    <form data-slot="register-form" onSubmit={handleSubmit(handleSubmitWithError)} className="flex flex-col gap-4">
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
      <TextField
        label="Confirmar senha"
        type="password"
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        className="focus-visible:outline-none focus-visible:ring-2"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
