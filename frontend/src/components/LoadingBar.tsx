import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Stack } from '@astryxdesign/core/Stack'
import { useIsLoading } from '../hooks/useApi'

/**
 * A thin line with a shimmer at the top of the application while data loads. Its
 * container has no height, so the line shows over the top edge and the screen does not move.
 */
export function LoadingBar() {
  const isLoading = useIsLoading()
  return (
    <Stack height={0} role="status" aria-label={isLoading ? 'Loading' : undefined}>
      {isLoading && <Skeleton height={3} radius="none" />}
    </Stack>
  )
}
