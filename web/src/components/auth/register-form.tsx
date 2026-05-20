import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button } from '@mui/material'
import { registerSchema, type RegisterForm } from '../../schemas/auth.schema'

interface RegisterFormProps {
  onSubmit: (data: RegisterForm) => Promise<void>
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  return (
    <form data-slot="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
