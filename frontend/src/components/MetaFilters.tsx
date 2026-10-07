import type { Meta } from '../api/types'
import { FilterSelect } from './FilterSelect'

interface Props {
  meta: Meta | undefined
  value: string
  onChange: (value: string) => void
}

/** The country filter. All list screens use the same one. */
export function CountryFilter({ meta, value, onChange }: Props) {
  return (
    <FilterSelect
      label="Country"
      value={value}
      onChange={onChange}
      options={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
    />
  )
}

/** The job level filter. */
export function JobLevelFilter({ meta, value, onChange }: Props) {
  return (
    <FilterSelect
      label="Job level"
      value={value}
      onChange={onChange}
      options={(meta?.job_levels ?? []).map((l) => ({ value: String(l), label: `Level ${l}` }))}
      width={140}
    />
  )
}
