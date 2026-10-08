import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Stack } from '@astryxdesign/core/Stack'
import type { ReactNode } from 'react'
import type { ApiState } from '../hooks/useApi'
import { useIsLate } from '../hooks/useIsLate'
import { ROW_HEIGHT } from './loadingRows'

interface Props<T> {
  state: ApiState<T>
  /** Returns true when the data has nothing to show. */
  isEmpty?: (data: T) => boolean
  emptyTitle?: string
  emptyDescription?: string
  /**
   * For a list: the number of rows that the data shows. With it, a later load that is slow
   * shows that number of rows with a shimmer in place of the old rows.
   */
  rowsOf?: (data: T) => number
  /** The height of one row with a shimmer, for a list with rows of 2 lines. */
  rowHeight?: number
  /**
   * The height of the loaded content, in pixels. With it, the first load keeps an empty box of
   * this height, so the screen does not move when the data arrives. A slow first load shows one
   * shimmer of this height. A later load keeps the old content.
   */
  loadingHeight?: number
  children: (data: T) => ReactNode
}

/**
 * Shows the loading, error, empty or loaded state of one API call.
 * Each screen uses it, so the four states look the same everywhere.
 * When a later load fails, the data that is on the screen stays, below the error.
 * While a later load runs, the old data stays. A list with `rowsOf` shows rows with a
 * shimmer when the load is slow, so a change of a filter is visible.
 */
export function DataState<T>({
  state,
  isEmpty,
  emptyTitle,
  emptyDescription,
  rowsOf,
  rowHeight,
  loadingHeight,
  children,
}: Props<T>) {
  const { data, error, isLoading, reload } = state
  const isLate = useIsLate(isLoading)

  if (data === undefined) {
    if (error) {
      return <LoadError message={error.message} onRetry={reload} />
    }
    if (!isLoading) {
      return null
    }
    return loadingHeight ? <LoadingBox height={loadingHeight} isLate={isLate} /> : <LoadingRows />
  }
  if (rowsOf && isLate) {
    return <LoadingRows count={Math.max(1, rowsOf(data))} rowHeight={rowHeight} />
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

const FIRST_LOAD_ROWS = 5

/** An empty box of the height of the content. A slow load fills it with one shimmer. */
function LoadingBox({ height, isLate }: { height: number; isLate: boolean }) {
  return (
    <Stack height={height} role="status" aria-busy="true" aria-label="Loading">
      {isLate && <Skeleton height={height} />}
    </Stack>
  )
}

/** Rows with a shimmer, in place of a list that loads. */
export function LoadingRows({
  count = FIRST_LOAD_ROWS,
  rowHeight = ROW_HEIGHT,
}: {
  count?: number
  rowHeight?: number
}) {
  return (
    <Stack gap={2} role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={rowHeight} index={index} />
      ))}
    </Stack>
  )
}
