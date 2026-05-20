import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { registerSchema, type RegisterForm as Values } from '../../schemas/auth.schema'

interface Props { onSubmit: (data: Values) => Promise<void> }

export const RegisterForm = ({ onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(registerSchema),
  })
  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))}>
      <Stack spacing={2}>
        <TextField label="E-mail" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Senha" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <TextField label="Confirmar Senha" type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </Stack>
    </form>
  )
}
