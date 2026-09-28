import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { formatNumber } from '@/utils/formatNumber'

const COLORS = {
  Successful: '#34d399',
  Active: '#38bdf8',
  Failed: '#f87171',
  Remaining: '#2a3441',
}

export function ProcessingChart({ processing }) {
  const {
    totalRows = 0,
    processedRows = 0,
    successfulRows = 0,
    failedRows = 0,
    remainingRows = 0,
  } = processing || {}

  const activeRows = Math.max(0, processedRows - successfulRows - failedRows)

  const data = [
    { name: 'Successful', value: successfulRows },
    { name: 'Active', value: activeRows },
    { name: 'Failed', value: failedRows },
    { name: 'Remaining', value: remainingRows },
  ].filter((entry) => entry.value > 0)

  const isEmpty = totalRows === 0

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Row Outcome Breakdown</h3>
      <p className="mb-2 text-xs text-ink-muted">Snapshot across all jobs</p>

      <div className="relative flex h-44 items-center justify-center">
        {isEmpty ? (
          <p className="text-xs text-ink-faint">No rows processed yet</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [formatNumber(value), name]}
                  contentStyle={{
                    background: '#10141c',
                    border: '1px solid #1e2530',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#e7eaf0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute flex flex-col items-center">
              <span className="text-lg font-semibold text-ink tabular-nums">
                {formatNumber(totalRows)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-ink-faint">Total rows</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {Object.entries(COLORS).map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
