import { useState } from 'react'
import { ApiError } from '../api/client'

/**
 * Runs one write request for a form. It keeps the error of each field,
 * so that the form shows the cause next to the input that caused it.
 */
export function useSubmit<T>(send: () => Promise<T>, onDone: (result: T) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string>()

  async function submit() {
    setIsSubmitting(true)
    setFieldErrors({})
    setFormError(undefined)
    try {
      onDone(await send())
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError(0, String(cause))
      if (error.fieldErrors.length > 0) {
        setFieldErrors(Object.fromEntries(error.fieldErrors.map((e) => [e.field, e.cause])))
      } else {
        setFormError(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
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
