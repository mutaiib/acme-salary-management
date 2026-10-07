import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Stack } from '@astryxdesign/core/Stack'
import type { FormEvent, ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  submitLabel?: string
  /** Use `destructive` for an action that the HR Manager cannot undo. */
  submitVariant?: 'primary' | 'destructive'
  isSubmitting?: boolean
  /** An error that does not belong to one field. */
  error?: string
  children: ReactNode
}

/** A dialog with a form, a Cancel button and a submit button. All form dialogs use it. */
export function FormDialog({
  title,
  subtitle,
  isOpen,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  submitVariant = 'primary',
  isSubmitting = false,
  error,
  children,
}: Props) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    // The default height limit of a dialog cut the buttons of a long form on a low window.
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      purpose="form"
      width={520}
      maxHeight="96dvh"
    >
      <DialogHeader title={title} subtitle={subtitle} onOpenChange={onClose} />
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={3} padding={4}>
          {error && <Banner status="error" title={error} />}
          {children}
          <Stack direction="horizontal" gap={2} hAlign="end">
            <Button label="Cancel" variant="ghost" onClick={onClose} />
            <Button
              label={submitLabel}
              variant={submitVariant}
              type="submit"
              isLoading={isSubmitting}
            />
          </Stack>
        </Stack>
      </form>
    </Dialog>
  )
}
