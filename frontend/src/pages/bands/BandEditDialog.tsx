import { useState } from 'react'
import { updateBand } from '../../api/bands'
import type { Band, BandRequest } from '../../api/types'
import { FormDialog, MoneyInput } from '../../components'
import { useSubmit } from '../../hooks/useSubmit'
import { formatJobLevel } from '../../lib/format'

interface Props {
  band: Band
  countryName: string
  onClose: () => void
  onChanged: () => void
}

const FIELDS: { name: keyof BandRequest; label: string }[] = [
  { name: 'min_minor', label: 'Minimum' },
  { name: 'mid_minor', label: 'Midpoint' },
  { name: 'max_minor', label: 'Maximum' },
]

export function BandEditDialog({ band, countryName, onClose, onChanged }: Props) {
  const [amounts, setAmounts] = useState<BandRequest>({
    min_minor: band.min_minor,
    mid_minor: band.mid_minor,
    max_minor: band.max_minor,
  })

  const form = useSubmit(
    () => updateBand(band.id, amounts),
    () => {
      onChanged()
      onClose()
    },
    FIELDS.map((field) => field.name),
  )

  return (
    <FormDialog
      title="Edit salary band"
      subtitle={`${countryName}, ${formatJobLevel(band.job_level)}`}
      isOpen
      onClose={onClose}
      onSubmit={() => void form.submit()}
      isSubmitting={form.isSubmitting}
      error={form.formError}
    >
      {FIELDS.map((field) => (
        <MoneyInput
          key={field.name}
          label={field.label}
          amountMinor={amounts[field.name]}
          onChange={(amountMinor) => setAmounts({ ...amounts, [field.name]: amountMinor })}
          currency={band.currency}
          step={1000}
          error={form.fieldErrors[field.name]}
        />
      ))}
    </FormDialog>
  )
}
