import { TextInput } from '@astryxdesign/core/TextInput'
import { useSearchText } from '../hooks/useSearchText'

interface Props {
  /** The search text that is applied now, from the address. */
  applied: string
  /** Called with the new text after the HR Manager stops typing. */
  onApply: (text: string) => void
}

/** The box that finds an employee by a part of the name, the email or the employee code. */
export function SearchBox({ applied, onApply }: Props) {
  const [text, setText] = useSearchText(applied, onApply)
  return (
    <TextInput
      label="Search"
      isLabelHidden
      startIcon="search"
      placeholder="Name, email or employee code"
      value={text}
      onChange={setText}
      hasClear
      size="sm"
      width={320}
    />
  )
}
