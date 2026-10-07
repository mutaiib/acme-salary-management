import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import type { Meta } from '../api/types'
import type { ApiState } from '../hooks/useApi'

/** Tells the HR Manager that the filter values did not load. It shows nothing in other cases. */
export function MetaBanner({ state }: { state: ApiState<Meta> }) {
  if (!state.error) {
    return null
  }
  return (
    <Banner
      status="warning"
      title="The filter values did not load"
      description="The filters and the date of today are not available."
      endContent={<Button label="Load again" variant="secondary" onClick={state.reload} />}
    />
  )
}
