import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Popover } from '@astryxdesign/core/Popover'
import { Text } from '@astryxdesign/core/Text'

interface Props {
  /** The term that the text explains, for example "Range penetration". */
  term: string
  /** The explanation, in 1 to 3 short sentences. */
  text: string
}

/**
 * An info button that opens the explanation of a term. A click or the Enter key opens it,
 * so it works with a keyboard and on a touch screen.
 */
export function TermHelp({ term, text }: Props) {
  return (
    <Popover label={`About: ${term}`} width={280} padding={4} content={<Text as="p">{text}</Text>}>
      <IconButton
        label={`What is this: ${term}?`}
        variant="ghost"
        size="sm"
        icon={<Icon icon="info" size="sm" />}
      />
    </Popover>
  )
}
