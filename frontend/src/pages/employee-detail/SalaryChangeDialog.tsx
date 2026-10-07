import { DateInput } from '@astryxdesign/core/DateInput'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { useState } from 'react'
import { changeSalary } from '../../api/employees'
import type { Employee } from '../../api/types'
import { FormDialog } from '../../components'
import { errorStatus, useSubmit } from '../../hooks/useSubmit'
import { todayIso } from '../../lib/dates'
import { formatMoney } from '../../lib/format'

interface Props {
  employee: Employee
  isOpen: boolean
  onClose: () => void
  onChanged: () => void
}

export function SalaryChangeDialog({ employee, isOpen, onClose, onChanged }: Props) {
  const [salary, setSalary] = useState<number | null>(employee.salary_minor / 100)
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayIso())

  const form = useSubmit(
    () =>
      changeSalary(employee.id, {
        new_salary_minor: Math.round((salary ?? 0) * 100),
        reason,
        effective_date: effectiveDate,
      }),
    () => {
      setReason('')
      onChanged()
      onClose()
    },
  )

  function handleSubmit() {
    // The API owns the pay rules. The form checks only that the required text is present.
    if (!reason.trim()) {
      form.setFieldErrors({ reason: 'Give a reason for the salary change.' })
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
      error={form.formError ?? form.fieldErrors.employee}
    >
      <NumberInput
        label="New salary"
        description="The base salary for one year, before tax."
        value={salary}
        onChange={setSalary}
        units={employee.currency}
        step={100}
        isRequired
        status={errorStatus(form.fieldErrors.new_salary_minor)}
        statusVariant="detached"
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
        value={effectiveDate}
        onChange={(value) => setEffectiveDate(value ?? todayIso())}
        max={todayIso()}
        isRequired
        status={errorStatus(form.fieldErrors.effective_date)}
        statusVariant="detached"
      />
    </FormDialog>
  )
}
