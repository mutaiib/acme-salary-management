import { DateInput } from '@astryxdesign/core/DateInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import type { ISODateString } from '@astryxdesign/core/utils'
import { useState } from 'react'
import { changeSalary } from '../../api/employees'
import type { Employee } from '../../api/types'
import { FormDialog, MoneyInput } from '../../components'
import { errorStatus, useSubmit } from '../../hooks/useSubmit'
import { formatMoney } from '../../lib/format'

interface Props {
  employee: Employee
  /** The date of the server. It is the default and the latest effective date. */
  today: string | undefined
  isOpen: boolean
  onClose: () => void
  onChanged: () => void
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
      subtitle={`Current salary: ${formatMoney(employee.salary_minor, employee.currency)}`}
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={form.isSubmitting}
      error={form.formError}
    >
      <MoneyInput
        label="New salary"
        description="The base salary for one year, before tax."
        amountMinor={salaryMinor}
        onChange={setSalaryMinor}
        currency={employee.currency}
        error={form.fieldErrors.new_salary_minor}
      />
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
