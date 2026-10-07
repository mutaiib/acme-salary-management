import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { useIsLoading } from '../hooks/useApi'

/**
 * A moving bar at the top of the application while data loads. Its container has no
 * height, so the bar shows over the top edge and the screen does not move.
 */
export function LoadingBar() {
  const isLoading = useIsLoading()
  return (
    <Stack height={0}>
      {isLoading && <ProgressBar label="Loading" isLabelHidden isIndeterminate />}
    </Stack>
  )
}
