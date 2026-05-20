import { Tabs, Tab } from '@mui/material'

interface MessageFilterProps {
  value: 'all' | 'agendado' | 'enviado'
  onChange: (value: 'all' | 'agendado' | 'enviado') => void
}

export function MessageFilter({ value, onChange }: MessageFilterProps) {
  return (
    <Tabs
      data-slot="message-filter"
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
    >
      <Tab label="Todos" value="all" />
      <Tab label="Agendado" value="agendado" />
      <Tab label="Enviado" value="enviado" />
    </Tabs>
  )
}
