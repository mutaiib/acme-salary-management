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
 */
export function DataState<T>({ state, isEmpty, emptyTitle, emptyDescription, children }: Props<T>) {
  const { data, error, isLoading, reload } = state

  if (error) {
    return (
      <Banner
        status="error"
        title="The data did not load"
        description={error.message}
        endContent={<Button label="Try again" variant="secondary" onClick={reload} />}
      />
    )
  }
  if (data === undefined) {
    return isLoading ? <LoadingRows /> : null
  }
  if (isEmpty?.(data)) {
    return (
      <EmptyState
        title={emptyTitle ?? 'Nothing to show'}
        description={emptyDescription}
        headingLevel={2}
      />
    )
  }
  return <>{children(data)}</>
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
