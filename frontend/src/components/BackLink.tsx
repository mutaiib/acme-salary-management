import { Icon } from '@astryxdesign/core/Icon'
import { Link } from '@astryxdesign/core/Link'
import { Stack } from '@astryxdesign/core/Stack'
import { ArrowLeft } from 'lucide-react'

interface Props {
  href: string
  label: string
}

/** The link above the title of a screen that goes back to the screen before it. */
export function BackLink({ href, label }: Props) {
  return (
    <Link href={href} isStandalone>
      {/* Link has no left icon property, so the arrow is the first part of the content. */}
      <Stack direction="horizontal" gap={1} vAlign="center">
        <Icon icon={ArrowLeft} />
        {label}
      </Stack>
    </Link>
  )
}
