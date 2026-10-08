import { DateInput } from '@astryxdesign/core/DateInput'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { TextArea } from '@astryxdesign/core/TextArea'
import type { ISODateString } from '@astryxdesign/core/utils'
import { useState } from 'react'
import { changeSalary } from '../../api/employees'
import type { Band, EmployeeDetail } from '../../api/types'
import { FormDialog, MoneyInput } from '../../components'
import { errorStatus, useSubmit } from '../../hooks/useSubmit'
import { formatMoney } from '../../lib/format'
import { changePct, raisedBy } from '../../lib/money'
import { roomToMaximum } from '../../lib/ranges'
import { ChangeFromTo } from './ChangeFromTo'
import { RangeBar } from './RangeBar'

interface Props {
  employee: EmployeeDetail
  /** The date of the server. It is the default and the latest effective date. */
  today: string | undefined
  isOpen: boolean
  onClose: () => void
  onChanged: () => void
}

/** How far a new salary is from the band maximum, in words. */
function roomNote(band: Band, salaryMinor: number, currency: string): string {
  const room = roomToMaximum(salaryMinor, band)
  const amount = formatMoney(Math.abs(room), currency)
  return room >= 0
    ? `Room to the band maximum: ${amount}.`
    : `This salary is ${amount} above the band maximum.`
}

// The names of the inputs of this form, as the API names them.
const SHOWN_FIELDS = ['new_salary_minor', 'reason', 'effective_date']

export function SalaryChangeDialog({ employee, today, isOpen, onClose, onChanged }: Props) {
  const [salaryMinor, setSalaryMinor] = useState<number | null>(employee.salary_minor)
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(today ?? '')

  const form = useSubmit(
    () =>
      changeSalary(employee.id, {
        new_salary_minor: salaryMinor ?? 0,
        reason,
        effective_date: effectiveDate,
      }),
    () => {
      setReason('')
      onChanged()
      onClose()
    },
    SHOWN_FIELDS,
  )

  function handleSubmit() {
    // The API owns the pay rules. The form checks only that the required values are present,
    // because the API cannot read a request without them.
    if (!reason.trim()) {
      form.setFieldErrors({ reason: 'Give a reason for the salary change.' })
      return
    }
    if (!effectiveDate) {
      form.setFieldErrors({ effective_date: 'Give an effective date.' })
      return
    }
    void form.submit()
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  return (
    <FormDialog
      title="Change salary"
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={form.isSubmitting}
      error={form.formError}
    >
      <Stack direction="horizontal" gap={3} vAlign="start" wrap="wrap">
        <MoneyInput
          label="New salary"
          description="For one year, before tax."
          amountMinor={salaryMinor}
          onChange={setSalaryMinor}
          currency={employee.currency}
          error={form.fieldErrors.new_salary_minor}
        />
        {/* The two inputs show the same change. A value in one sets the other. */}
        <NumberInput
          label="Increase"
          description="From the current salary."
          value={salaryMinor === null ? null : changePct(employee.salary_minor, salaryMinor)}
          onChange={(pct) => setSalaryMinor(raisedBy(employee.salary_minor, pct))}
          units="%"
          step={0.5}
          width={140}
        />
      </Stack>
      <ChangeFromTo
        oldMinor={employee.salary_minor}
        newMinor={salaryMinor}
        currency={employee.currency}
      />
      {employee.band && (
        <Stack gap={1}>
          <RangeBar band={employee.band} salaryMinor={salaryMinor ?? employee.salary_minor} />
          {salaryMinor !== null && (
            <Text type="supporting">
              {roomNote(employee.band, salaryMinor, employee.currency)}
            </Text>
          )}
        </Stack>
      )}
      <TextArea
        label="Reason"
        description="The salary history shows this text."
        value={reason}
        onChange={setReason}
        rows={2}
        isRequired
        status={errorStatus(form.fieldErrors.reason)}
        statusVariant="detached"
      />
      <DateInput
        label="Effective date"
        value={effectiveDate ? (effectiveDate as ISODateString) : undefined}
        onChange={(value) => setEffectiveDate(value ?? '')}
        max={today as ISODateString | undefined}
        isRequired
        status={errorStatus(form.fieldErrors.effective_date)}
        statusVariant="detached"
      />
    </FormDialog>
  )
}
