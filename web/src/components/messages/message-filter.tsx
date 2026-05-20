interface MessageFilterProps {
  value: 'all' | 'scheduled' | 'sent'
  onChange: (value: 'all' | 'scheduled' | 'sent') => void
}

const options: { label: string; value: 'all' | 'scheduled' | 'sent' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Enviado', value: 'sent' },
]

export function MessageFilter({ value, onChange }: MessageFilterProps) {
  return (
    <div data-slot="message-filter" className="inline-flex bg-zinc-100 rounded-lg p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
