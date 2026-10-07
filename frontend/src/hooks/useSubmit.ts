import { useState } from 'react'
import { toApiError } from '../api/client'

/**
 * Runs one write request for a form.
 *
 * `shownFields` are the API field names that the form has an input for. An error for one
 * of them shows next to that input. Each other error shows at the top of the form,
 * so no error is lost.
 */
export function useSubmit<T>(
  send: () => Promise<T>,
  onDone: (result: T) => void,
  shownFields: string[] = [],
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()

  async function submit() {
    setIsSubmitting(true)
    reset()
    let result: T
    try {
      result = await send()
    } catch (cause) {
      const error = toApiError(cause)
      const shown = error.fieldErrors.filter((item) => shownFields.includes(item.field))
      const other = error.fieldErrors.filter((item) => !shownFields.includes(item.field))
      setFieldErrors(Object.fromEntries(shown.map((item) => [item.field, item.cause])))
      if (other.length > 0 || shown.length === 0) {
        setFormError(other.map((item) => item.cause).join(' ') || error.message)
      }
      return
    } finally {
      setIsSubmitting(false)
    }
    // Outside the `try`: an error in the caller is not an error of the request.
    onDone(result)
  }

  function reset() {
    setFieldErrors({})
    setFormError(undefined)
  }

  return { submit, reset, isSubmitting, fieldErrors, setFieldErrors, formError }
}

/** The `status` prop of an Astryx input, for a field that has an error. */
export function errorStatus(message: string | undefined) {
  return message ? ({ type: 'error', message } as const) : undefined
}
