// The height of one row with a shimmer. With the gap, 10 rows take the space of a list of
// 10 rows with its page controls (a check in a browser gave 413 px).
export const ROW_HEIGHT = 34
// The gap of the stack of rows: the space token 2 of the theme, 8 px.
const ROW_GAP = 8

/** The height of `count` rows with a shimmer, with the gaps between them. */
export function loadingRowsHeight(count: number): number {
  return count * ROW_HEIGHT + (count - 1) * ROW_GAP
}
