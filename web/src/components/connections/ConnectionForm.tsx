import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack, TextField } from '@mui/material'
import { connectionSchema, type ConnectionForm as Values } from '../../schemas/connection.schema'

interface Props { defaultValues?: Values; onSubmit: (data: Values) => Promise<void> }

export const ConnectionForm = ({ defaultValues, onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(connectionSchema),
    defaultValues: defaultValues ?? { name: '' },
  })
  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))}>
      <Stack spacing={2}>
        <TextField label="Nome" slotProps={{ htmlInput: { 'aria-label': 'Nome' } }}
          {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </Stack>
    </form>
  )
}
