import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export default function DayScoreTrendChart({ rows, streak }) {
  return (
    <div>
      <div className="flex items-baseline justify-between px-1">
        <p className="text-xs font-semibold text-briefly-muted">Session score trend</p>
        <p className="text-xs text-briefly-muted">{streak > 0 ? `${streak} day streak` : ''}</p>
      </div>
      <div className="mt-2 rounded-card bg-briefly-surface p-2 shadow-brieflyCard">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={36}
              tick={{ fontSize: 10, fill: '#6d7175' }}
            />
            <YAxis hide />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#008060"
              fill="#008060"
              fillOpacity={0.1}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
