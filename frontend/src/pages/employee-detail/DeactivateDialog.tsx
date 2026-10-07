import { Text } from '@astryxdesign/core/Text'
import { deactivateEmployee } from '../../api/employees'
import type { Employee } from '../../api/types'
import { FormDialog } from '../../components'
import { useSubmit } from '../../hooks/useSubmit'

interface Props {
  employee: Employee
  isOpen: boolean
  onClose: () => void
  onDeactivated: () => void
}

export function DeactivateDialog({ employee, isOpen, onClose, onDeactivated }: Props) {
  const form = useSubmit(
    () => deactivateEmployee(employee.id),
    () => {
      onDeactivated()
      onClose()
    },
  )

  return (
    <FormDialog
      title={`Deactivate ${employee.full_name}`}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={() => void form.submit()}
      submitLabel="Deactivate"
      submitVariant="destructive"
      isSubmitting={form.isSubmitting}
      error={form.formError ?? form.fieldErrors.employee}
    >
      <Text as="p">
        The employee will not count in the headcount, the payroll cost or the pay insights. The
        salary history stays.
      </Text>
    </FormDialog>
  )
}
