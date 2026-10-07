import { Link } from '@astryxdesign/core/Link'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import type { Outlier, OutlierStatus } from '../../api/types'
import { Money } from '../../components'

type OutlierRow = Outlier & Record<string, unknown>

const LIMIT_HEADER: Record<OutlierStatus, string> = {
  below: 'Band minimum',
  above: 'Band maximum',
}

const DIFFERENCE_HEADER: Record<OutlierStatus, string> = {
  below: 'Below by',
  above: 'Above by',
}

interface Props {
  status: OutlierStatus
  outliers: Outlier[]
}

export function OutlierTable({ status, outliers }: Props) {
  const money = (key: 'salary_minor' | 'band_limit_minor' | 'difference_minor', header: string) =>
    ({
      key,
      header,
      width: proportional(1),
      align: 'end',
      renderCell: (outlier) => <Money amountMinor={outlier[key]} currency={outlier.currency} />,
    }) satisfies TableColumn<OutlierRow>

  const columns: TableColumn<OutlierRow>[] = [
    {
      key: 'full_name',
      header: 'Name',
      width: proportional(2),
      renderCell: (outlier) => <Link href={`/employees/${outlier.id}`}>{outlier.full_name}</Link>,
    },
    { key: 'job_title', header: 'Job title', width: proportional(2) },
    { key: 'job_level', header: 'Level', width: pixel(80) },
    { key: 'country', header: 'Country', width: pixel(100) },
    money('salary_minor', 'Salary'),
    money('band_limit_minor', LIMIT_HEADER[status]),
    money('difference_minor', DIFFERENCE_HEADER[status]),
  ]

  return (
    <Table data={outliers as OutlierRow[]} columns={columns} idKey="id" density="compact" hasHover />
  )
}
