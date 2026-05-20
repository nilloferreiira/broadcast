import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button } from '@mui/material'
import { contactSchema, type ContactForm } from '../../schemas/contact.schema'

interface ContactFormProps {
  defaultValues?: ContactForm
  onSubmit: (data: ContactForm) => Promise<void>
}

export function ContactForm({ defaultValues, onSubmit }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultValues ?? { name: '', phone: '' },
  })

  return (
    <form data-slot="contact-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TextField
        label="Nome"
        error={!!errors.name}
        helperText={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Telefone"
        error={!!errors.phone}
        helperText={errors.phone?.message}
        {...register('phone')}
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
