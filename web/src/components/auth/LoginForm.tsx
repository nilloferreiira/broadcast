import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { loginSchema, type LoginForm as Values } from '../../schemas/auth.schema'

interface Props { onSubmit: (data: Values) => Promise<void> }

export const LoginForm = ({ onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(loginSchema),
  })
  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))}>
      <Stack spacing={2}>
        <TextField label="E-mail" inputProps={{ 'aria-label': 'E-mail' }}
          {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Senha" type="password" inputProps={{ 'aria-label': 'Senha' }}
          {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </Stack>
    </form>
  )
}
