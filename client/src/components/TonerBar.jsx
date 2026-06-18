const TONER_COLORS = {
  black: { bg: 'bg-gray-900', label: 'Siyah' },
  cyan: { bg: 'bg-cyan-500', label: 'Cyan' },
  magenta: { bg: 'bg-pink-500', label: 'Magenta' },
  yellow: { bg: 'bg-yellow-500', label: 'Sarı' },
};

function getColor(level) {
  if (level === null || level === undefined) return 'bg-gray-200';
  if (level <= 15) return 'bg-red-500';
  if (level <= 30) return 'bg-orange-500';
  return 'bg-green-500';
}

export default function TonerBar({ color, level, showLabel = true }) {
  const config = TONER_COLORS[color] || { bg: 'bg-blue-500', label: color };
  const barColor = color === 'black' ? config.bg : getColor(level);

  return (
    <div className="flex items-center gap-2 min-w-0">
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 w-14 shrink-0">
          {config.label}
        </span>
      )}
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, level || 0))}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right shrink-0 ${
        level !== null && level <= 15 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {level !== null ? `${level}%` : '—'}
      </span>
    </div>
  );
}
