import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button } from '@mui/material'
import { connectionSchema, type ConnectionForm } from '../../schemas/connection.schema'

interface ConnectionFormProps {
  defaultValues?: ConnectionForm
  onSubmit: (data: ConnectionForm) => Promise<void>
}

export function ConnectionForm({ defaultValues, onSubmit }: ConnectionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnectionForm>({
    resolver: zodResolver(connectionSchema),
    defaultValues: defaultValues ?? { name: '' },
  })

  return (
    <form data-slot="connection-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TextField
        label="Nome da conexão"
        error={!!errors.name}
        helperText={errors.name?.message}
        {...register('name')}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        className="focus-visible:outline-none focus-visible:ring-2"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}
