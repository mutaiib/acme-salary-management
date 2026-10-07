import { Selector } from '@astryxdesign/core/Selector'

export interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  options: Option[]
  /** The selected value. An empty string means "all". */
  value: string
  onChange: (value: string) => void
  width?: number
}

/** One filter. The HR Manager clears it to see all values again. */
export function FilterSelect({ label, options, value, onChange, width = 180 }: Props) {
  return (
    <Selector
      label={label}
      options={options}
      value={value || null}
      onChange={(next: string | null) => onChange(next ?? '')}
      placeholder="All"
      hasClear
      size="sm"
      width={width}
    />
  )
}
