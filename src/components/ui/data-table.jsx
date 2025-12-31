import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from
  '@/components/ui/table';
import { EmptyState } from './empty-state';
import { FileX } from 'lucide-react';
















export function DataTable({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title="No data found"
        description={emptyMessage} />);


  }

  return (
    <div className="card-elevated overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) =>
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) =>
            <TableRow
              key={keyExtractor(item)}
              className={onRowClick ? 'cursor-pointer table-row-hover' : 'table-row-hover'}
              onClick={() => onRowClick?.(item)}>

              {columns.map((column) =>
                <TableCell key={column.key} className={column.className}>
                  {column.render ?
                    column.render(item) :
                    item[column.key]}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>);

}