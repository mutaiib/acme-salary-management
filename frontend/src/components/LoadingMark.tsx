import { Spinner } from '@astryxdesign/core/Spinner'
import { useIsLate } from '../hooks/useIsLate'

/**
 * A small spinner for a load in a place that has no rows, for example a figure in a dialog.
 * A list shows its load as rows with a shimmer: see `DataState`.
 */
export function LoadingMark({ isLoading }: { isLoading: boolean }) {
  return useIsLate(isLoading) ? <Spinner size="md" aria-label="Loading" /> : null
}
