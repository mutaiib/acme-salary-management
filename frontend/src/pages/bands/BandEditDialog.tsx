import { NumberInput } from '@astryxdesign/core/NumberInput'
import { useState } from 'react'
import { updateBand } from '../../api/bands'
import type { Band } from '../../api/types'
import { FormDialog } from '../../components'
import { errorStatus, useSubmit } from '../../hooks/useSubmit'

interface Props {
  band: Band
  countryName: string
  onClose: () => void
  onChanged: () => void
}

const toUnits = (amountMinor: number) => amountMinor / 100
const toMinor = (units: number | null) => Math.round((units ?? 0) * 100)

export function BandEditDialog({ band, countryName, onClose, onChanged }: Props) {
  const [minimum, setMinimum] = useState<number | null>(toUnits(band.min_minor))
  const [midpoint, setMidpoint] = useState<number | null>(toUnits(band.mid_minor))
  const [maximum, setMaximum] = useState<number | null>(toUnits(band.max_minor))

  const form = useSubmit(
    () =>
      updateBand(band.id, {
        min_minor: toMinor(minimum),
        mid_minor: toMinor(midpoint),
        max_minor: toMinor(maximum),
      }),
    () => {
      onChanged()
      onClose()
    },
  )

  const amount = (
    label: string,
    value: number | null,
    onChange: (value: number) => void,
    field: string,
  ) => (
    <NumberInput
      label={label}
      value={value}
      onChange={onChange}
      units={band.currency}
      step={1000}
      isRequired
      status={errorStatus(form.fieldErrors[field])}
      statusVariant="detached"
    />
  )

  return (
    <FormDialog
      title="Edit salary band"
      subtitle={`${countryName}, Level ${band.job_level}`}
      isOpen
      onClose={onClose}
      onSubmit={() => void form.submit()}
      isSubmitting={form.isSubmitting}
      error={form.formError}
    >
      {amount('Minimum', minimum, setMinimum, 'min_minor')}
      {amount('Midpoint', midpoint, setMidpoint, 'mid_minor')}
      {amount('Maximum', maximum, setMaximum, 'max_minor')}
    </FormDialog>
  )
}
