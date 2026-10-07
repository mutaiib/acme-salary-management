import { Selector } from '@astryxdesign/core/Selector'

export interface Option<V extends string = string> {
  value: V
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

/**
 * One filter. The closed field shows the name of the filter, so a row of filters
 * has one line. The HR Manager clears it to see all values again.
 */
export function FilterSelect({ label, options, value, onChange, width = 180 }: Props) {
  return (
    <Selector
      label={label}
      options={options}
      value={value || null}
      onChange={(next: string | null) => onChange(next ?? '')}
      isLabelHidden
      placeholder={label}
      hasClear
      size="sm"
      width={width}
    />
  )
}
