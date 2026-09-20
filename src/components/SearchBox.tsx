import { Search } from 'lucide-react'

type SearchBoxProps = {
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por cliente, asunto, pedido o mensaje"
      />
    </label>
  )
}
