interface DailyBarChartProps {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
  color?: string;
}

export function DailyBarChart({ title, subtitle, data, color = '#0d9488' }: DailyBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 600;
  const height = 140;
  const gap = 2;
  const barWidth = data.length ? width / data.length - gap : 0;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <p className="text-lg font-semibold text-slate-900">{total}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 4);
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(barWidth, 1)}
              height={Math.max(barHeight, d.value > 0 ? 2 : 0)}
              fill={color}
              rx={1.5}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#e2e8f0" strokeWidth="1" />
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
