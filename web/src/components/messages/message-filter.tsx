import { Tabs, Tab } from '@mui/material'

interface MessageFilterProps {
  value: 'all' | 'scheduled' | 'sent'
  onChange: (value: 'all' | 'scheduled' | 'sent') => void
}

export function MessageFilter({ value, onChange }: MessageFilterProps) {
  return (
    <Tabs
      data-slot="message-filter"
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
    >
      <Tab label="Todos" value="all" />
      <Tab label="Agendado" value="scheduled" />
      <Tab label="Enviado" value="sent" />
    </Tabs>
  )
}
