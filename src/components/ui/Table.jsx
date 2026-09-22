import { cn } from '../../lib/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 数据表格。
 *
 * 替换 6 个列表页里各自手写的 <table> 模板。
 *
 * 加载态用骨架行而不是转圈：骨架让用户提前看到「这里将出现几行、每行多高」，
 * 视觉上比一个居中旋转的圆更快。骨架行按 20ms 递增延迟，形成轻微的自下而上节奏。
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  loading = false,
  error = null,
  empty = null,
  onRowClick,
  skeletonRows = 5,
  className,
}) {
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-3 py-2.5 text-left text-xs font-medium text-muted whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {showSkeleton &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={'skeleton-' + rowIndex} className="border-b border-line/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3">
                    <span
                      className="block h-3.5 rounded bg-surface-2 animate-pulse"
                      style={{ animationDelay: rowIndex * 20 + 'ms', width: '70%' }}
                    />
                  </td>
                ))}
              </tr>
            ))}

          {!showSkeleton &&
            rows.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line/60 transition-colors duration-100 ease-entry',
                  onRowClick && 'cursor-pointer hover:bg-surface-2'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5 text-fg align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {error && (
        <div className="py-10 text-center text-sm text-danger">
          加载失败：{error.message || String(error)}
        </div>
      )}

      {showEmpty && (
        <div className="py-12 text-center">
          {empty || <p className="text-sm text-muted">暂无数据</p>}
        </div>
      )}
    </div>
  );
}

/**
 * 分页。替换 5 处手写分页。
 */
export function Pagination({ page, pageSize, total, onChange, className }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn('flex items-center justify-between gap-4 px-1 py-3', className)}>
      <p className="text-xs text-muted tabular-nums">
        第 {from}–{to} 条，共 {total} 条
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:pointer-events-none transition-colors duration-100"
          aria-label="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs text-muted tabular-nums px-2">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:pointer-events-none transition-colors duration-100"
          aria-label="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}