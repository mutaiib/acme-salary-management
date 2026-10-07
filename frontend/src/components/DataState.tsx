import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Stack } from '@astryxdesign/core/Stack'
import type { ReactNode } from 'react'
import type { ApiState } from '../hooks/useApi'

interface Props<T> {
  state: ApiState<T>
  /** Returns true when the data has nothing to show. */
  isEmpty?: (data: T) => boolean
  emptyTitle?: string
  emptyDescription?: string
  children: (data: T) => ReactNode
}

/**
 * Shows the loading, error, empty or loaded state of one API call.
 * Each screen uses it, so the four states look the same everywhere.
 * When a later load fails, the data that is on the screen stays, below the error.
 * While a later load runs, the old data stays. `LoadingBar` shows the load.
 */
export function DataState<T>({ state, isEmpty, emptyTitle, emptyDescription, children }: Props<T>) {
  const { data, error, isLoading, reload } = state

  if (data === undefined) {
    if (error) {
      return <LoadError message={error.message} onRetry={reload} />
    }
    return isLoading ? <LoadingRows /> : null
  }
  const content = isEmpty?.(data) ? (
    <EmptyState
      title={emptyTitle ?? 'Nothing to show'}
      description={emptyDescription}
      headingLevel={2}
    />
  ) : (
    children(data)
  )
  // Without an error, the content has no wrapper. A table in a card then keeps the
  // space above it, because Astryx moves the first element of a wrapper to the card edge.
  if (!error) {
    return <>{content}</>
  }
  return (
    <Stack gap={4}>
      <LoadError message={error.message} onRetry={reload} />
      {content}
    </Stack>
  )
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Banner
      status="error"
      title="The data did not load"
      description={message}
      endContent={<Button label="Try again" variant="secondary" onClick={onRetry} />}
    />
  )
}

function LoadingRows() {
  return (
    <Stack gap={2} aria-busy="true" aria-label="Loading">
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} height={32} index={index} />
      ))}
    </Stack>
  )
}
