import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import type { Outlier, OutlierStatus } from '../../api/types'
import { EmployeeLink, moneyColumn, type TableRow } from '../../components'

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
  const columns: TableColumn<TableRow<Outlier>>[] = [
    {
      key: 'full_name',
      header: 'Name',
      width: proportional(2),
      renderCell: (outlier) => <EmployeeLink id={outlier.id} name={outlier.full_name} />,
    },
    { key: 'job_title', header: 'Job title', width: proportional(2) },
    {
      key: 'job_level',
      header: 'Level',
      width: pixel(100),
      renderCell: (outlier) => `Level ${outlier.job_level}`,
    },
    { key: 'country', header: 'Country', width: pixel(100) },
    moneyColumn<Outlier>('salary_minor', 'Salary'),
    moneyColumn<Outlier>('band_limit_minor', LIMIT_HEADER[status]),
    moneyColumn<Outlier>('difference_minor', DIFFERENCE_HEADER[status]),
  ]

  return (
    <Table
      data={outliers as TableRow<Outlier>[]}
      columns={columns}
      idKey="id"
      density="compact"
      hasHover
    />
  )
}
