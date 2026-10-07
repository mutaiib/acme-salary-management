# Design brief: ACME Salary Management UI

Status: first run. Mode: existing design system (Astryx). Run for a FEATURE with MODERATE risk.
Source of truth: `frontend/node_modules/@astryxdesign/core` 0.6.5 and `@astryxdesign/theme-neutral` 0.6.5.
Rules: `CLAUDE.md` Article 3 (writing) and Article 4 (UI). Terms: `docs/glossary.md`.

Note of 8 October 2026: this brief is the record of the design step. After it, the developer removed the Pay equity screen from the product, and the theme became source in `frontend/src/themes/neutral/`. The principles, the page patterns and the color rules are still valid. `docs/specs/screen-clarity-spec.md` records what the screens have now.

This brief gives decisions, not options. Each decision has a reason. A programmer can build each screen from it.

## 0. The problem in one paragraph

The screens use the right Astryx parts but give them no hierarchy. Everything is grey on white, and each screen is a row of cards above a long table.
The screens do not answer a question first. They do not say what a number is, and they do not say the period of an amount.
The words "median", "mean", "share of cost" and "compa-ratio" appear with no meaning. The filter bar has six labeled controls.
Colour carries no meaning, because the accent is near black (`#1b1b1b`).

## 1. What the design system contains

### 1.1 Setup (as built)

| Item | Value | File |
|---|---|---|
| Library | `@astryxdesign/core` 0.6.5, StyleX prebuilt, no build plugin | `frontend/package.json` |
| Theme | `neutralTheme` from `@astryxdesign/theme-neutral/built`, wrapped in `<Theme>` | `frontend/src/App.tsx` |
| CSS order | `reset.css`, `astryx.css`, `theme-neutral/theme.css` | `frontend/src/index.css` |
| Shell | `AppShell height="fill"` with `SideNav` (sections "Insights" and "Manage"); `contentPadding` is the default 0 | `frontend/src/App.tsx` |
| Links | `LinkProvider component={RouterLink}` | `frontend/src/components/RouterLink.tsx` |
| Font | Figtree is named by the theme, but the app does not load it. The browser uses the fallback stack. | `frontend/index.html` has no font link |
| Icons | Only the semantic names of `Icon` work with no new package: `close, chevronDown, chevronLeft, chevronRight, check, success, error, warning, info, calendar, clock, externalLink, menu, moreHorizontal, search, arrowUp, arrowDown, arrowsUpDown, funnel, viewColumns, copy, wrench`. | `Icon.doc.mjs` |

`lucide-react` is in `node_modules` only as a dependency of the theme. It is not in `frontend/package.json`. Do not import it. Adding it needs the approval of the developer.

### 1.2 Tokens of the installed theme (light values; dark values exist for each)

Colour (semantic tokens, from `theme.css`):

| Token | Light | Use |
|---|---|---|
| `--color-background-body` | `#f1f1f1` | page background (grey) |
| `--color-background-surface`, `-card`, `-popover` | `#ffffff` | Card, Table, Popover |
| `--color-background-muted` | `#f1f1f1` | equals the page. A muted Card is invisible. |
| `--color-accent` | `#1b1b1b` | primary Button, links, selected item. Near black today. |
| `--color-accent-muted` | `#f1f1f1` | selected nav item background |
| `--color-text-primary` / `-secondary` | `#000000` / `#474747` | body / supporting text |
| `--color-border` / `-emphasized` | `#00000014` / `#d4d4d4` | hairline / control border |
| `--color-success`, `-warning`, `-error` | `#00490b`, `#4b3900`, `#76000c` | ink for text and icons, not fill |
| Status fill (Badge, StatusDot, ProgressBar) | accent `#0074e2`, success `#198100`, warning `#ffce2f`, error `#c9303a` | solid fills |
| Hue tints (`blue, teal, red, orange, yellow, green, purple, pink, cyan, gray`) | `--color-background-<hue>` and `--color-text-<hue>` | tinted Badge and Card |

Typography (theme scale: base 14 px, ratio 1.2, font Figtree for body and heading):

| Element | Size | Weight | Use |
|---|---|---|---|
| `Heading level={1}` | 24 px | semibold | page title, one per screen |
| `Heading level={2}` | 20 px | semibold | section title |
| `Heading level={3}` / `{4}` | 17 px / 14 px | bold | sub-section title / group label |
| `Text type="display-3"` / `"display-2"` / `"display-1"` | 29 / 35 / 42 px | normal | headline figure |
| `Text type="large"` | 17 px | semibold | lead sentence (set `weight="normal"`) |
| `Text type="body"` | 14 px | normal | default |
| `Text type="label"` | 14 px | medium | field and stat label |
| `Text type="supporting"` | 12 px | normal, colour secondary | notes, units, hints |

Spacing steps (base 4 px). Only these steps exist in props: `0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10`.

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|---|---|
| px | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 |

Shape: radius inner 6 px, element 10 px, container 12 px. Shadow tokens `low`, `med`, `high`. The neutral theme sets Card and Section padding to step 3 (12 px).
Motion: fast 125 ms, medium 300 ms. Astryx honours `prefers-reduced-motion`.

### 1.3 Facts that change the design

1. Cards are white on a grey page. This contrast is the one surface cue the theme gives. `Card variant="muted"` removes it. The current `PaySummary` uses `muted`, so it reads as loose text.
2. The semantic Badge variants (`warning`, `error`, `success`, `info`) are solid fills. The Astryx docs say to use them only for states that need action, and never in every row.
3. `Table` has no header tooltip prop. `TableColumn.header` is a `ReactNode`, so a header can hold a label and an info button.
4. `Tooltip` is for short, non-essential hints. The Astryx docs say to never put essential information in a tooltip.
5. `Layout` has the regions `header`, `start`, `content`, `end` and `footer`. `Layout` takes `contentWidth` and `defaultHasDividers`. The CLI template `dashboard-scorecard` uses `LayoutHeader padding={6} hasDivider` and `LayoutContent padding={6}`.

## 2. Design principles for this product

1. **Answer first, then evidence.** Each insight screen opens with one plain sentence that answers the question of the screen; the figures and the table follow.
   - So we do: write the lead sentence from the data, in a pure function with a test.
   - So we do not: open a screen with a row of cards and no sentence.
2. **Plain words, defined once.** A term that a new HR Manager may not know has a short meaning that is one click away.
   - So we do: use `TermHelp` (section 4.1) on "median", "mean", "compa-ratio", "range penetration", "salary band", "gap", "payroll cost".
   - So we do not: use a hover-only tooltip for a meaning, or leave a term with no meaning.
3. **Every number says what it is, and its period.** A figure has a label, a unit and a period in the same place.
   - So we do: show "for one year, before tax" in the caption above each table and in the hint of each headline figure, with the currency.
   - So we do not: put the unit note below the table, or show an amount with no period.
4. **One primary thing for each screen.** One headline figure is the largest item. One table is the main block. One button is primary.
   - So we do: make the first figure `display-2`, the others `display-3` or `large`, and keep one primary Button.
   - So we do not: show 3 equal cards, 2 tab rows and a table with the same weight.
5. **Exceptions stand out. Normal values stay quiet.** Only a salary outside the band, a flagged country or an error gets colour.
   - So we do: show a `Badge` or a warning icon only for the exception; show a normal value as plain text.
   - So we do not: put a badge on a normal row, or use colour for decoration.
6. **Less on the screen.** A screen shows what answers its question. The rest is behind one click.
   - So we do: use 5 controls or fewer in a filter row, 6 columns or fewer in a table, and 20 rows in a page.
   - So we do not: show a control that repeats a column header (for example "Sort by").
7. **Use the Astryx part, and its token.** A new look comes from the part and its props, not from CSS.
   - So we do: use Astryx `Layout`, `Card`, `Badge`, `SegmentedControl`, `Popover` and the spacing steps.
   - So we do not: write a hex value, a pixel padding or a custom style in a screen (Article 4).

## 3. Page patterns

All patterns use `Layout` inside the `AppShell` main region. Build one shared component `PageLayout` in `frontend/src/components/PageLayout.tsx` (Article 4.4: all 6 screens use it). It replaces `Stack gap={n} padding={6}` in each page.

```
<Layout height="fill" contentWidth={1200} defaultHasDividers header={...} content={...} end={...} />
```

If `LayoutHeader` does not accept `padding`, set `padding={6}` on `Layout`. Check with `npm run astryx -- template detail-page --skeleton`.

### 3.1 List pattern (Employees, Salary bands, the Pay health list)

| Region | Astryx components | Spacing |
|---|---|---|
| Header | `LayoutHeader padding={6}` with `PageHeader`: `Heading level={1}`, `Text type="supporting"` (one short line), actions at the end | `gap={1}` between title and line |
| Banners | `MetaBanner`, `DataState` error `Banner` | first in content |
| Lead (optional) | `Text type="large" weight="normal" as="p" maxWidth={720}` | below banners |
| Filter row | `FilterBar` (`Stack` horizontal, wrap, `role="search"`): `TextInput size="sm"` with `startIcon`, `Selector size="sm"` with `isLabelHidden`, `SegmentedControl size="sm"` for a status | `gap={3}` |
| Summary (optional) | `Card padding={5}` with a `Grid` of `Stat` (section 5.4) | `gap={6}` inside |
| Results | caption row (`Text type="supporting"` count at the start, `UnitNote` at the end), `Table`, footer row (range text, `Pagination`) | `gap={3}` |

- `LayoutContent padding={6}` holds a `VStack gap={6}`. This puts 24 px between regions. Inside a region use `gap={3}` (12 px).
- Table props: `density="balanced"`, `dividers="rows"`, `hasHover` when a row has a link, `isStriped` off. Reason: rows have dividers and a hover state; a stripe adds a third row cue.
- Page size: 20 rows (`page_size=20`) for Employees and the Pay health list. Reason: one screen shows the whole page. This changes `listEmployees` and `listOutliers` and their tests. It is a second-wave item.
- Sort: put `sortable` on the columns that the API sorts (`useTableSortable`, `allowUnsortedState`). Do not add a "Sort by" Selector.

### 3.2 Insight pattern (Pay overview, Pay health, Pay equity)

| Region | Astryx components | Spacing |
|---|---|---|
| Header | as the list pattern. A switch for the whole screen goes in the header actions. | |
| Answer | `Lead`: `Text type="large" weight="normal" as="p" maxWidth={720}`, then `Text type="supporting"` for the date or the currency | `gap={2}` |
| Figures | `Grid columns={{ minWidth: 220, max: 3 }} gap={4}` of `Card padding={5}` with `Stat`. The first `Stat` is `size="xl"` (`display-2`). | `gap={4}` |
| Evidence | `SectionHeader` (`Heading level={2}` at the start, `SegmentedControl` or nothing at the end), `UnitNote`, `Table` | `gap={3}` |
| Caveat | `Banner status="info"` after the evidence, or `Collapsible` for a long method note | `gap={3}` |

- `LayoutContent padding={6}` holds a `VStack gap={8}`. Regions are 32 px apart.
- A `Card` holds one figure only. Do not put a `Card` in a `Card`. Do not wrap a table in a `Card`.
- A `Stat` shows: label (`type="label"`, secondary), value (display), one hint line (`type="supporting"`) with the unit and the period.

### 3.3 Record pattern (Employee detail)

| Region | Astryx components | Spacing |
|---|---|---|
| Header | `LayoutHeader padding={6}`: `Breadcrumbs variant="supporting"` (`BreadcrumbItem href="/employees"`, then the name), then a row: `Avatar name size="lg"`, `VStack` with `Heading level={1}` and `Text type="supporting"`, actions at the end | `gap={3}` |
| Exception | `Banner status="warning" container="card"`, only when the salary is below range or above range | first in content |
| Main | `VStack gap={8}`: salary `Card`, band position `Card`, salary history `Table` under `Heading level={2}` | `gap={8}` |
| Side panel | `LayoutPanel width={320} padding={6} hasDivider role="complementary" label="Employee details"` with `MetadataList` (one column) | `gap={4}` |

- Below 1024 px the panel moves under the main region. Use `useMediaQuery('(max-width: 1024px)')` from `@astryxdesign/core/hooks`, as the Astryx `detail-page` template does.
- One primary Button: "Change salary". "Deactivate" is `variant="secondary"`.

### 3.4 Form in a dialog

| Region | Astryx components | Spacing |
|---|---|---|
| Frame | `Dialog purpose="form" width={560}`, `DialogHeader title subtitle` | |
| Fields | `FormLayout defaultOptionality="required"` (all fields are required, so no field shows a marker). Pair a short field with another in a nested `FormLayout direction="horizontal"`. | `padding={5}` |
| Error | `Banner status="error"` above the fields | `gap={4}` |
| Footer | `Stack direction="horizontal" hAlign="end"`: `Button variant="ghost"` "Cancel", `Button variant="primary"` | `gap={2}`; 24 px above (`gap={6}`) |

- The subtitle names the record and the unit, for example "Germany, Level 3. Amounts are for one year, before tax, in EUR."
- Each field has a `description` in one short sentence. Use `FormDialog` for Deactivate too. Reason: `AlertDialog` has no place for a server error.
- After a save, show `useToast` with a `body` such as "Salary saved." `useToast` takes `type` `"info"` or `"error"`. This is a second-wave item.

## 4. Shared pieces to build (Article 4.4)

| Piece | File | Built from | Used by |
|---|---|---|---|
| `PageLayout` | `components/PageLayout.tsx` | `Layout`, `LayoutHeader`, `LayoutContent`, `LayoutPanel` | 6 screens |
| `Lead` | `components/Lead.tsx` | `Text type="large"` | 4 screens |
| `UnitNote` | `components/UnitNote.tsx` | `Text type="supporting"` | all tables |
| `SectionHeader` | `components/SectionHeader.tsx` | `Heading level={2}`, `Stack` | 4 screens |
| `Stat` (extend) | `components/Stat.tsx` | `size="xl"`, optional `help` | 4 screens |
| `TermHelp` | `components/TermHelp.tsx` | `Popover`, `IconButton`, `Icon icon="info"` | 5 screens |
| `StatusFilter` | `components/StatusFilter.tsx` | `SegmentedControl` | Employees and Pay health |

### 4.1 `TermHelp`: the one way to explain a term

Decision: an info `IconButton` that opens a `Popover`. Not a `Tooltip`. Not a `HoverCard`.

- Reason: a `Popover` opens on click or on Enter, so it works with a keyboard and on touch. A `Tooltip` is for non-essential hints. A `HoverCard` needs a hover.
- Build: `<Popover label="About the median" placement="below" width={280} padding={4} content={...}>` around `<IconButton label="What is the median?" variant="ghost" size="sm" icon={<Icon icon="info" size="sm" />} />`.
- Do not set the `tooltip` prop of the `IconButton`. It would open two layers.
- Content: `Heading level={4}` with the term, then 1 to 3 short sentences from `frontend/src/lib/terms.ts`. One record for each term: `{ name, text }`.
- Where: in a table header (inside the `header` node), next to a `Stat` label, next to a section title. Never inside a `sortable` header, because a button in a button is invalid. The columns with a `TermHelp` are not sortable.
- The visible helper text under a figure stays. The `TermHelp` adds the definition. It does not replace the unit and the period.

Text of the terms (STE; add "Median" and "Mean" to `docs/glossary.md` first):

| Key | Text |
|---|---|
| `median` | The median is the middle value. Half of the salaries are lower, and half are higher. |
| `mean` | The mean is the sum of the salaries divided by the number of salaries. A few high salaries raise the mean. |
| `gap` | The gap is the pay of men minus the pay of women, as a percentage of the pay of men. A positive gap means that men have the higher pay. |
| `meanGap` | The mean gap uses the mean salary of men and the mean salary of women. |
| `medianGap` | The median gap uses the median salary of men and the median salary of women. A few high salaries do not move it. |
| `salaryBand` | A salary band is the pay range for one job level in one country. It has a minimum, a midpoint and a maximum. |
| `compaRatio` | The compa-ratio is the salary divided by the band midpoint. A ratio of 1.00 means that the salary is at the midpoint. |
| `rangePenetration` | Range penetration is the position of the salary in the band. 0% is the band minimum. 100% is the band maximum. |
| `payrollCost` | The payroll cost is the sum of the salaries of the active employees, for one year, in the reporting currency. |
| `correctionCost` | The correction cost moves all below-range salaries to the band minimum. It is for one year. |
| `flag` | A country gets a flag when the mean gap or the median gap is more than 5%, in favor of men or of women. |
| `headcount` | The headcount is the number of active employees. |

## 5. Screen-by-screen

Wording rules for all screens (Article 3): one term for one meaning; instruction up to 20 words; description up to 25 words; active voice. Use "for one year" for the period. Use "median", "mean", "band minimum", "below range". Use "Lowest salary" and "Highest salary" for a group, because "minimum" and "maximum" belong to the band.

`UnitNote` text (one line above each table that shows money):
- Salaries in the local currency: "Amounts are for one year, before tax, in the local currency."
- Reporting currency: "Amounts are for one year, before tax, in USD."

### 5.1 `/overview`: `OverviewPage.tsx`, `GroupTable.tsx`

Wrong now:
- The description "The payroll cost of ACME, and where ACME spends it." gives no answer.
- Two `StatCard`s (29 px, normal weight) have the same weight. "Payroll cost" says "For one year, in USD" only in small grey text.
- `TabList hasDivider` switches the table, but it looks like page navigation.
- The table has 7 columns, all the same weight. "Share of cost" does not say of what. "Median salary" has no meaning. Salary columns have no period.
- The note about currency and exchange rates is below the table (`OverviewPage.tsx` line 83).

Target:
- Layout: insight pattern.
- Lead: "ACME pays {headcount} active employees {cost} for one year." Support line: "Totals are in USD. Exchange rates are of {date}."
- Figures: one `Card padding={5}` with two `Stat` separated by `Divider orientation="vertical"`. "Payroll cost" is `size="xl"`. Hint: "For one year, in USD". Add `TermHelp term="payrollCost"`. "Headcount" is `size="lg"`. Hint: "Active employees".
- Remove `StatRow`/`StatCard` here.
- Evidence: `SectionHeader` with `Heading level={2}` "Pay by country" (the word follows the grouping) and `SegmentedControl label="Group by"` with "Country", "Department", "Job level". This replaces `TabList`. Reason: the control picks one of three groupings of the same table; it is not a page.
- `UnitNote` goes above the table (move `shown.note` here).
- Columns (7): `Country` (`proportional(2)`), `Headcount`, `Payroll cost`, `Share of ACME payroll cost`, `Lowest salary`, `Median salary` with `TermHelp term="median"`, `Highest salary`.
  - Quiet: `Lowest salary` and `Highest salary` in `Text color="secondary"`. Normal weight: `Median salary` and `Payroll cost`.
  - Share cell: `ProgressBar variant="accent"` and the percent. Reason: the accent bar is the only colour in the table, and it shows the answer.
  - Default order: largest payroll cost first (client sort).
- Table props: `density="balanced"`, `dividers="rows"`.

### 5.2 `/pay-health`: `PayHealthPage.tsx`, `OutlierTable.tsx`, `RangeStatusBadge.tsx`

Wrong now:
- The description does not say how many employees. Three equal cards: two of them are `SelectableCard` that act as a tab, and nothing shows that.
- The hint "To move all below-range salaries to the band minimum, for one year" is a long sentence in a small card.
- A `Heading level={2}` "Employees below range" repeats the card.
- The table has 7 columns. "Below by" has no emphasis, so the exception does not stand out.

Target:
- Layout: insight pattern with a list.
- Lead: "{below} employees get less than the band minimum. {above} employees get more than the band maximum." Second sentence: "It costs {cost} for one year to move all below-range salaries to the band minimum." When both are 0: "No employee is outside the salary band."
- Figures: one `Card padding={5}` with `Stat size="xl"` "Correction cost". Hint: "For one year, in USD". `TermHelp term="correctionCost"`. Remove the two count cards.
- Selection: `StatusFilter` (`SegmentedControl label="Show"`) above the list with the items "Below range ({n})" and "Above range ({n})". It writes `status` in the address as now. Reason: the control sits next to the list that it changes.
- Heading: `Heading level={2}` "Employees below range" stays, in `SectionHeader`, with `UnitNote` under it.
- Filter row: search, country, job level. Labels hidden (section 5.4).
- Columns (6): `Name` (link, then the code as `Text type="supporting"` in the same cell), `Job title` (the level as supporting text below), `Country`, `Salary`, `Band minimum` or `Band maximum` with `TermHelp term="salaryBand"`, `Below by` or `Above by`.
  - `Below by` and `Above by`: `weight="semibold"` and a leading `Icon icon="arrowDown"` or `"arrowUp"` with `color="warning"`. All other cells are normal or secondary.
  - No Badge in a row. Reason: every row is an exception, so a badge repeats.
- Empty state: `EmptyState icon={<Icon icon="success" />}` with the existing title and text.

### 5.3 `/pay-equity`: `PayEquityPage.tsx`, `GapTable.tsx`

Wrong now:
- The description is a formula. A blue `Banner` with 3 sentences comes before the answer.
- "Mean gap, organization" and "Median gap, organization" never say what mean and median are. The two cards weigh the same.
- The table has `Men` and `Women` as bare numbers (headcount, but the header does not say so), a `Flag` column, and "Not enough data" in one column only.

Target:
- Layout: insight pattern.
- Description: "How the pay of women compares with the pay of men." Lead: "The median salary of women is {x}% lower than the median salary of men." If the gap is negative: "...{x}% higher...". If no gap: "ACME has too few employees of one gender to show a gap." Second sentence: "{k} of {n} countries have a gap of more than 5%."
- Figures (3 cards in a `Grid`): `Median gap` (`size="xl"`, `TermHelp term="medianGap"`, hint "ACME, all countries"), `Mean gap` (`size="lg"`, `TermHelp term="meanGap"`), `Countries with a flag` (`size="lg"`, hint "Gap of more than 5%"). Reason: the median gap is the main figure, because a few high salaries do not move it.
- Caveat after the figures: `Banner status="info"` with the title "These figures are unadjusted". Description, 3 sentences: "An unadjusted gap does not correct for job level, department or length of service. It shows where to look. It does not prove unequal pay for equal work." The Banner stays visible. The reader sees the answer first and the caveat next.
- Table: `SectionHeader` "Gap by country". `UnitNote`: "A positive gap means that men have the higher pay. Each country uses its local currency." The note for a small group: "A group with fewer than {n} men or {n} women shows no gap."
- Columns (5): `Country`, `Employees` (one cell: "{men} men, {women} women", `type="supporting"`), `Mean gap` + `TermHelp`, `Median gap` + `TermHelp`, `Flag`.
  - A small group shows "Too few employees" in `Text type="supporting"` in both gap cells.
  - `Flag`: `Badge variant="warning" icon={<Icon icon="warning" size="sm" />} label="Above 5%"` for a flagged country only.
  - Default order: flagged countries first, then by median gap.

### 5.4 `/employees`: `EmployeesPage.tsx`, `PaySummary.tsx`, `summarySentences.ts`, `FilterSelect.tsx`, `SearchBox.tsx`, `MetaFilters.tsx`

Wrong now:
- Six labeled controls: each `Selector` shows a label above a field, so the bar is two lines high.
- `PaySummary` is a `Card variant="muted"`. `muted` has the colour of the page, so the answer looks like loose text. The sentences have no visual rank.
- A "333 employees" line sits above the table and repeats the summary. The table has 7 columns, with a "Sort by" control that repeats the headers.

Target (decisions):
1. **Filter row, 5 controls on one line of 36 px:**
   - `SearchBox`: `TextInput size="sm" isLabelHidden startIcon={<Icon icon="search" />}`, `width={320}`. Keep `label="Search"` for the screen reader.
   - `Country`, `Department`, `Job level`: `Selector size="sm" isLabelHidden placeholder="Country" hasClear`. The closed field reads as the field name. A chosen value replaces it.
   - `Status`: `StatusFilter` (`SegmentedControl label="Status" size="sm"`) with "All", "Active", "Inactive". "All" writes no `status` in the address.
   - Remove `Sort by`. Sort with the header of `Name` and `Hired` (`useTableSortable`, values `name`, `hire_date`, `-hire_date`; the unsorted state is the code order).
   - Add a ghost `Button label="Clear filters"` that shows only when a filter is set.
   - Reason: all filters stay visible (the HR Manager needs them) but the bar is half as high, and one control is gone.
2. **Summary: headline figures and one sentence.** Replace `Card variant="muted"` with `Card padding={5}` (default variant) that holds:
   - a `Grid columns={{ minWidth: 200, max: 3 }} gap={6}` of three `Stat size="lg"`:
     - "Active employees". Hint: "In this list".
     - "Payroll cost". Hint: "For one year, in USD".
     - "Median salary" with `TermHelp term="median"`. Hint: "For one year, in {currency}".
   - a `Divider`, then `Text type="supporting" as="p"` with the sentences: "Half of these employees get less than the median salary, and half get more. The lowest salary is {x}. The highest salary is {y}."
   - when the status is not Active: the existing note "These figures count active employees only. The list below can also show inactive employees." in the same `Text`.
   - `summarySentences()` keeps sentence 2 and 3 (change "middle salary" to "median salary"). The first sentence is replaced by the figures. Update `summarySentences.test.ts`.
   - Reason: a figure with a label is faster to read than a sentence, and the sentence keeps the plain meaning that the developer asked for.
3. **Table:** 6 columns: `Name` (sortable; link and the `Inactive` badge), `Job title` (the level as `Text type="supporting"` under the title), `Department`, `Country`, `Hired` (sortable; `formatDate`), `Salary` (end aligned). `Code` leaves the table as a column and shows under the name as `Text type="supporting"`. Reason: 7 columns become 6, and the code stays findable.
4. **Footer:** `Text type="supporting"` "Showing {a} to {b} of {n} employees" at the start; `Pagination` at the end. Remove the "{n} employees" line above the table.
5. `UnitNote` above the table: "Salaries are for one year, before tax, in the local currency."

### 5.5 `/employees/:id`: `EmployeeDetailPage.tsx`, `PositionInRange.tsx`, `RangeBar.tsx`, `RangeStatusBadge.tsx`, `SalaryHistoryTable.tsx`

Wrong now:
- A text link "Back to Employees" and a single `Stat` "Current salary" with no period.
- A `MetadataList` of 6 items in 3 columns above the band section. The country shows the code ("DE").
- "Position in range" has a quiet text "In range" or "No salary band".
- The band bar repeats "Midpoint" in the mark and in the legend.

Target:
- Layout: record pattern.
- Header: `Breadcrumbs` "Employees / {name}". `Avatar name={full_name} size="lg"`. `Heading level={1}` with the name. `Text type="supporting"` "{job_title}, {department}". An inactive employee gets `Badge variant="neutral" label="Inactive"` and no action buttons (as now).
- Exception: for below range or above range, `Banner status="warning" container="card"` with title "This salary is {diff} below the band minimum." or "...above the band maximum." Compute `diff` with a pure function in `lib/ranges.ts`. For `in_range`: no banner.
- Salary `Card padding={5}`: `Stat size="xl"` label "Salary", hint "For one year, before tax, in {currency}".
- Band position `Card padding={5}`:
  - `Heading level={3}` "Position in the salary band". Under it: "Band for {Level n} in {country name}: {min} to {max}."
  - Two `Stat size="md"`: "Compa-ratio" (`TermHelp term="compaRatio"`), "Range penetration" (`TermHelp term="rangePenetration"`). The hint under each stays: "Salary divided by the band midpoint." and "0% is the band minimum. 100% is the band maximum."
  - `RangeBar`: `ProgressBar variant="accent"` in the band, `variant="warning"` outside. Keep the 3 amounts under the bar. Remove the mark label "Midpoint" (the legend names it).
  - No band: `EmptyState isCompact` with title "No salary band" and description "Set a band for {Level n} in {country name}." and `Button label="Open Salary bands" href="/bands?country={code}"`.
- Salary history: `Heading level={2}`, `UnitNote`, then the table with 5 columns in this order: `Effective date`, `Reason` (`proportional(3)`), `Old salary`, `New salary`, `Recorded on` (`Text color="secondary"`).
- Side panel `MetadataList` (one column): "Employee code", "Email", "Job level", "Country" (the name, from `useMeta`), "Hire date", "Gender".

### 5.6 `/bands`: `BandsPage.tsx`, `BandEditDialog.tsx`

Wrong now:
- The country repeats in every row. The page has one control, in a bar of its own.
- "Minimum", "Midpoint" and "Maximum" have no period or currency. Each row has the same ghost "Edit" button.

Target:
- Layout: list pattern.
- Description: "The pay range for each job level in each country." Lead (definition, because the screen has no computed answer): "A salary band is the pay range for one job level in one country. It has a minimum, a midpoint and a maximum."
- Filter: one `Selector size="sm" isLabelHidden placeholder="Country" hasClear` at the end of the header actions. No bar of its own.
- Table: group the rows by country with `useTableGroupedRows` (`groupBy` country name, `renderGroupHeader` "{Country}, {currency}", `groupOrder` alphabetical, `collapsedGroups` in `useState`). Remove the `Country` column. Columns: `Job level`, `Minimum`, `Midpoint` (`TermHelp term="salaryBand"`), `Maximum`, `Edit` (`Button variant="ghost" size="sm"`). `isStriped` is off, because group headers break a stripe.
- `UnitNote`: "Amounts are for one year, before tax, in the local currency of each country."
- Dialog: section 3.4. Fields: `Minimum` (description "The lowest salary in this band."), `Midpoint` ("The reference salary. The compa-ratio uses it."), `Maximum` ("The highest salary in this band.").

## 6. Colour and emphasis

Decision on the accent: override `--color-accent` inside the neutral theme. Do not add a theme package.
- Reason: the theme packages `butter`, `chocolate` and others are not installed. A new package needs the approval of the developer. `defineTheme({ extends: neutralTheme, tokens })` needs none.
- Build: new file `frontend/src/theme.ts`.
  ```ts
  import { defineTheme } from '@astryxdesign/core/theme'
  import { neutralTheme, neutralPalettes } from '@astryxdesign/theme-neutral'
  // tokens: '--color-accent': [blue light 40, blue dark 80], '--color-accent-muted': [blue light 95, existing dark]
  export const acmeTheme = defineTheme({ name: 'acme', extends: neutralTheme, tokens: { ... } })
  ```
  Use `neutralPalettes.blue` stops, not a hex value (Article 4.2). Check the exact export shape in `theme-neutral/src/neutralPalettes.ts`.
  Use the source import `@astryxdesign/theme-neutral`, because it uses runtime style injection. Keep the `theme.css` import in `index.css`. `--color-on-accent` stays white in light mode, as the neutral theme sets it.
- Fallback if `extends` does not accept the built theme or the colour does not change: set the same token in `index.css` on `:root` as `var(--astryx-theme-neutral-color-status-fill-accent)`, and check it in the browser.
- Contrast (computed): blue stop 40 (`#005cb8`) on white is 6.5:1. On the page grey `#f1f1f1` it is 5.8:1. White text on it is 6.5:1. Stop 50 (`#0074e2`) gives only 4.6:1 on white and 4.0:1 on the grey page, so a link would fail AA on the page. Do not use stop 50 for text.
- Result: the primary Button, links, the selected nav item and the focus accent become blue. The page gains one clear action colour.

Colour use (decisions):

| Meaning | Component and props | Reason |
|---|---|---|
| Salary outside the band (record) | `Banner status="warning" container="card"` and `Badge variant="warning"` with `Icon arrowDown` or `arrowUp` | one per screen; icon and text add a second cue |
| Salary outside the band (list row) | `Icon color="warning"` and semibold text in the difference cell | a badge in each row repeats |
| Flagged country | `Badge variant="warning"` with `Icon icon="warning"` | it is an exception |
| Inactive employee | `Badge variant="neutral"` | not an alarm |
| Data did not load | `Banner status="error"` (as now) | |
| Caveat (unadjusted gap) | `Banner status="info"` | |
| No exception found | `EmptyState` with `Icon icon="success"` | good news is quiet |
| In band, normal value | plain text, no colour | principle 5 |
| Share, band position | `ProgressBar variant="accent"`; `warning` outside the band | the one chart-like element |
| Delete or deactivate | `Button variant="destructive"` | as now |

Tinted Card variants (`blue`, `teal`, and others): do not use them in this product.
- Reason: the Astryx docs say colour cards are for categories, not for status. This product has no category that needs a colour. Pink and blue for gender would also carry a stereotype.
- `Card variant="muted"` has the colour of the page. Do not use it.
- Use `Card elevation="none"` (the default). Use `elevation="low"` only for an overlay (Popover, Dialog), which the theme sets itself.

Contrast and access rules:
1. Normal text needs 4.5:1. Large text (17 px semibold or 24 px) needs 3:1. Check the accent text on the grey page, not only on a white Card.
2. Use only `primary`, `secondary` and `accent` text colours for readable text. Do not use `disabled` or `placeholder` for a value.
3. Colour is never the only cue. A status has text, and an exception has an icon.
4. Do not remove the Astryx focus ring. Every control must work with a keyboard: `SegmentedControl` (arrow keys), `Popover` (Enter and Escape), `Table` sort headers.
5. Controls in a filter row use `size="sm"` (desktop tool). Buttons that save or change data use the default `md` size.
6. Do not set a value in the dark scheme by hand. Give a `[light, dark]` pair from the palette.

## 7. Components checked and rejected

| Component | Decision | Reason |
|---|---|---|
| `PowerSearch`, `Tokenizer`, `Token` | Do not use | 5 equality filters do not need a query builder. The URL filters stay simple. |
| `Toolbar` | Do not use for filters | Roving tab index and the `role="toolbar"` replace the `role="search"` of `FilterBar`. `Stack` gives the same row. |
| `HoverCard` | Do not use | It needs a hover. It does not work on touch. |
| `Tooltip` for a meaning | Do not use | The Astryx docs forbid essential content in a tooltip. |
| `Timestamp` | Do not use | A date with no time shifts with the time zone. `formatDate` uses UTC. |
| `AlertDialog` | Do not use | It cannot show a server error. `FormDialog` can. |
| `Stepper`, `DropdownMenu`, `MoreMenu` | Do not use | The forms have 3 fields. A row has one action. |
| `List` and `Item` for the history | Do not use | The history is tabular. |
| A rail of definitions in `LayoutPanel` | Do not use | It takes 320 px from tables with 6 columns. `TermHelp` is closer to the term. |
| Chart libraries | Do not use | The Astryx chart packages are canary only. `ProgressBar` is enough. |
| Other theme packages, `lucide-react` | Do not add | They need the approval of the developer. |
| `Avatar`, `Breadcrumbs`, `Collapsible`, `Toast`, `SegmentedControl`, `FormLayout`, `Divider`, `Popover`, `IconButton`, `Icon` | Use | Confirmed in 0.6.5. See sections 3 and 5. |

Not confirmed in 0.6.5 (wanted, not found):
- A `Stat` or `KPI` component in core. The project `Stat` stays.
- A header help prop on `TableColumn`. `TermHelp` goes inside the `header` node.
- A drawer. The Astryx `detail-page` template says it is not available.
- A semantic `pencil` icon (for Edit). Use the text button "Edit".

## 8. Do first

The 8 changes below give the most visible gain for the least work. Do them in this order. Keep the tests green after each step (Article 1).

1. **Accent and font.** Add `theme.ts`, wrap `<Theme theme={acmeTheme}>`, add the Figtree `<link>` to `index.html` (the theme file says the app must load the font; offline, the fallback stack works). Files: `frontend/src/theme.ts` (new), `frontend/src/App.tsx`, `frontend/index.html`.
2. **Words and units.** Rename the headers and add `UnitNote` above each table; move the currency note above the table. Files: `GroupTable.tsx`, `OverviewPage.tsx`, `OutlierTable.tsx`, `PayHealthPage.tsx`, `GapTable.tsx`, `PayEquityPage.tsx`, `BandsPage.tsx`, `SalaryHistoryTable.tsx`, `PositionInRange.tsx`, `components/UnitNote.tsx` (new).
3. **Lead sentences.** Add `Lead` and one pure function for each insight screen, each with a test. Files: `components/Lead.tsx` (new), `pages/overview/overviewLead.ts` (new), `pages/pay-health/payHealthLead.ts` (new), `pages/pay-equity/payEquityLead.ts` (new), the 3 pages, `docs/glossary.md` (add "Median" and "Mean").
4. **`TermHelp`.** Build it and use it on the headers and labels in section 4.1. Files: `components/TermHelp.tsx` (new), `lib/terms.ts` (new), `components/Stat.tsx`, `GroupTable.tsx`, `GapTable.tsx`, `PayEquityPage.tsx`, `PositionInRange.tsx`, `OutlierTable.tsx`.
5. **Page frame and headline figures.** Add `PageLayout`; replace `Stack padding={6}` in the 6 pages. Give `Stat` the `xl` size and `StatCard` `padding={5}`. Files: `components/PageLayout.tsx` (new), `PageHeader.tsx`, `Stat.tsx`, `StatCard.tsx`, `StatRow.tsx`, `index.ts`, 6 pages.
6. **Employees: lighter filters and the summary strip.** Hidden labels, `StatusFilter`, remove "Sort by", sortable headers, new `PaySummary`. Files: `FilterSelect.tsx`, `SearchBox.tsx`, `MetaFilters.tsx`, `FilterBar.tsx`, `components/StatusFilter.tsx` (new), `DataTable.tsx`, `EmployeesPage.tsx`, `PaySummary.tsx`, `summarySentences.ts`, `summarySentences.test.ts`, `EmployeesPage.test.tsx`.
7. **Overview and Pay health controls.** `SegmentedControl` for the grouping and for below or above; accent share bars; one hero figure. Files: `OverviewPage.tsx`, `GroupTable.tsx`, `PayHealthPage.tsx`, `OutlierTable.tsx`, their tests.
8. **Employee detail.** `Breadcrumbs`, `Avatar`, warning `Banner`, side `MetadataList`, band `EmptyState`. Files: `EmployeeDetailPage.tsx`, `PositionInRange.tsx`, `RangeBar.tsx`, `RangeStatusBadge.tsx`, `lib/ranges.ts`, `EmployeeDetailPage.test.tsx`.

Second wave (after review): grouped Bands table, `FormLayout` in the dialogs, `useToast` after a save, page size 20, client sort on the Overview and Pay equity tables.

Test impact to expect: tests that find `tablist`, `below-count`, `above-count` or the six filter labels must change in steps 6 and 7. Keep the `data-testid` of the headline figures (`payroll-cost`, `headcount`, `correction-cost`, `organization-mean-gap`).

[ ] Reviewed
