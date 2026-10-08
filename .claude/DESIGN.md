# Design brief: ACME Salary Management UI

This brief gives the design rules of the screens, as built. The design system is Astryx (`@astryxdesign/core` 0.6.5). The rules of the constitution apply: `CLAUDE.md` Article 3 (writing) and Article 4 (UI). The terms are in `docs/glossary.md`.

The Bee design agent wrote the first brief after the review of the first screens. This document keeps its principles and records the patterns that the screens have now. `docs/specs/screen-clarity-spec.md` has the criteria.

## The problem that the brief answers

The first screens used the right Astryx components, but gave them no hierarchy. Each screen was a row of cards above a long table. A screen did not say what a figure was, and an amount did not state its period. Color had no meaning, because the accent of the neutral theme is almost black.

## Principles

1. **Answer first, then evidence.** A screen opens with the figures that answer its question. The table follows.
2. **Plain words, defined one time.** A term that a new HR Manager does not know has a short explanation, one click away, behind an info button.
3. **Each number says what it is.** A figure has a label, a currency and a period in the same place: "For one year, in USD".
4. **One primary thing for each screen.** One row of headline figures, one main table, one primary button.
5. **Exceptions stand out. Normal values stay quiet.** Only a salary outside the band, an inactive employee or an error gets a color.
6. **Less on the screen.** A screen shows what answers its question. A control does not repeat a column header.
7. **Use the Astryx component and its token.** A new look comes from a component and its properties, not from CSS.

## Setup

| Item | Value | File |
|---|---|---|
| Theme | The Astryx neutral theme as source, with a blue accent | `frontend/src/themes/neutral/`, `frontend/src/theme.ts` |
| Accent | Blue 40 of the palette of the theme. Its contrast on white is 6.5:1 | `frontend/src/theme.ts` |
| Font | Figtree, which the theme names | `frontend/index.html` |
| Icons | The icon set of the theme (`lucide-react`). A navigation item has an icon | `frontend/src/App.tsx` |
| Shell | `AppShell` with a `SideNav` in 2 sections: Insights and Manage. The navigation collapses to icons | `frontend/src/App.tsx` |
| Links | Astryx links use the router | `frontend/src/components/RouterLink.tsx` |

## Page patterns

Each screen is a vertical stack with a padding of 24 px: the title block, then the sections.

| Pattern | Screens | Structure |
|---|---|---|
| Insight | Pay overview, Pay health | `PageHeader`, a `StatRow` of 3 `StatCard`, then one `Panel` with a switch at the end of its title row and one table |
| Analysis | Pay analysis | `PageHeader`, a `TabList` of 3 tabs, then one `Panel` for the open tab: a chart or a table. The address keeps the open tab. A tab keeps its height while it loads |
| List | Employees, Salary bands, Exchange rates | `PageHeader`, a `FilterBar`, then the table. The Employees screen has a card with the pay figures of the list above the table. A band row shows its headcount, and its employees below range and above range as plain numbers that are links |
| Introduction | Welcome | A column in the center of the window, with no navigation: the purpose, a card for each capability, and one primary button |
| Record | Employee detail | A link back to the list, `PageHeader` with the name and the actions, a card with the salary and its position in the band, a `Panel` with the details, a `Panel` with the salary history |
| Form | Salary change, band change, deactivation | `FormDialog` with `useSubmit`. An error of an input shows at the input. Another error shows at the top of the dialog. A change form shows the current value and the new value together. The band form shows the effect of the change before the save |

## Shared components

All are in `frontend/src/components/`. A screen composes them, and each one composes Astryx components.

| Component | Use |
|---|---|
| `PageHeader` | The title block, with the one `h1` of the screen |
| `Panel` | A section in a card, with a title row |
| `Stat`, `StatCard`, `StatRow` | A figure with its label, its note, and an info button for its explanation |
| `TermHelp` | The info button that opens the explanation of a term. It works with a keyboard |
| `DataState` | The loading, empty and error states of one API call |
| `DataTable`, `moneyColumn`, `jobLevelColumn` | A table and its common columns |
| `FilterBar`, `FilterSelect`, `CountryFilter`, `JobLevelFilter`, `SearchBox` | The filters of a list. `useUrlFilters` keeps them in the address |
| `ListPagination` | The pages of a list, and the number of rows on a page |
| `FormDialog`, `MoneyInput` | A form in a dialog, and an input for an amount |
| `ChartFigure` | The frame of a chart, with its table view. `hooks/useChartColors` gives the colors from the theme tokens |
| `BackLink` | The link above the title that goes back to the screen before, with an arrow. A list goes back to the same view of Pay analysis. A record goes back to the list that opened it, with the filters of that list |
| `Money`, `StatusBadge`, `EmployeeLink`, `MetaBanner`, `LoadingBar` | Small parts that 2 or more screens use |
| `LoadingRows`, `LoadingMark` | A list shows rows with a shimmer when a later load is slow, for example after a change of a filter (`rowsOf` of `DataState`). A section with a known height keeps that height while it loads (`loadingHeight`). `LoadingMark` is a small spinner for a figure that is not in a list. The two show after 150 ms, so a quick reply does not make them flash |

## Color rules

| Meaning | Component | Reason |
|---|---|---|
| The primary action, a link, the selected navigation item | The blue accent | One clear color for an action |
| A salary below range | A red badge. The list shows the difference with a minus sign; the record shows "Below range" with an arrow down | The sign, the arrow and the word give a second cue, not only the color |
| The employees below range and above range of a band, on the Salary bands screen | A plain number that is a link. A zero is grey text | A badge in each row made the table tall. The column header gives the meaning |
| A salary above range | A green badge. The list shows the difference with a plus sign; the record shows "Above range" with an arrow up | The same |
| A salary in range | No badge. The range bar shows the position | A normal value stays quiet |
| An inactive employee | A grey badge | It is not an alarm |
| Salaries outside the band, on the Pay overview | A warning banner with a link to Pay health | One exception notice on the screen |
| The data did not load | An error banner with a button to try again | |
| A share of a total, a position in a band | An Astryx progress bar | A progress bar shows one value. A chart follows the rules of the section Charts |

Rules for contrast and access:

1. Normal text has a contrast of 4.5:1 or more. Large text has 3:1 or more.
2. A color is not the only cue. An icon, a sign or a word says the same thing.
3. Each control has a visible name or an accessible name.
4. A dialog, a filter and an info button work with a keyboard.

## Charts

The screens use Recharts 3 for a chart. Decision 8 of `docs/tradeoffs.md` gives the reason. A chart follows these rules:

- One value axis. The value axis starts at zero.
- Thin bars with a gap between them. A bar of one series has a rounded top end of 4 px. A stacked bar has square ends.
- Grid lines and axes use `--color-border`.
- All text uses `--color-text-secondary` or `--color-text-primary`. Text never uses the color of the series. A number in a part of a bar uses `--color-on-dark`.
- One series needs no legend.
- Each bar has a hover tooltip.
- Each chart has a table view with the same values. A screen reader reads the table view.
- The first series uses `--color-data-categorical-blue`. Each color comes from a theme token.
- A chart of 2 or more series has a legend. The text of the legend uses the text color.
- Below range is `--color-data-categorical-red`, and above range is `--color-data-categorical-green`, as the badges of the outlier list. The check of the palette passed with one warning. A person with a red-green color deficiency sees the 2 colors as near. The color is thus never the only cue. The chart has a gap between the 2 parts, a legend, the number with its sign in each part (`-72`, `+72`), and a table view.
- A bar opens the list of its employees, and shows a pointer. The section says so in words. The list shows a link back to the chart.
- The labels of an axis have one short form (`$20K`).
- `ChartFigure` holds a chart. It hides the marks from a screen reader and gives the table view. `useChartColors` gives the colors.

## Amounts

- A salary shows all its digits.
- A large total shows a short form, for example `$575.28M`. The full amount shows on hover.
- Each amount states its period: "for one year".
- A screen shows the name of a country, not its code.

## Components that the screens do not use, and why

| Component | Reason |
|---|---|
| A tinted card | The Astryx documentation keeps a color card for a category, not for a status |
| A bar of 3 progress bars for a salary band | It did not read as one bar. A band is a row of 3 amounts |
| A tooltip for an explanation | A tooltip opens on hover only. An info button with a popover also works with a keyboard and on a touch screen |
