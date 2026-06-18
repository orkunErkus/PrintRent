const TONER_CONFIG = {
  black: { label: 'Siyah', color: '#1f2937', border: '#374151' },
  cyan: { label: 'Cyan', color: '#06b6d4', border: '#0891b2' },
  magenta: { label: 'Magenta', color: '#ec4899', border: '#db2777' },
  yellow: { label: 'Sarı', color: '#eab308', border: '#ca8a04' },
};

function CircularGauge({ level, colorConfig, size = 80 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, level || 0)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={level !== null ? offset : circumference}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={`text-lg font-bold ${
        level !== null && level <= 15 ? 'text-red-600' : 'text-gray-700'
      }`}>
        {level !== null ? `${level}%` : '—'}
      </span>
      <span className="text-xs font-medium text-gray-500">{colorConfig.label}</span>
    </div>
  );
}

export default function TonerGauge({ tonerLevels }) {
  const tonerKeys = ['black', 'cyan', 'magenta', 'yellow'];
  const hasToner = tonerKeys.some(k => tonerLevels?.[k] !== null && tonerLevels?.[k] !== undefined);

  if (!hasToner) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-gray-400">Toner verisi yok</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4 sm:gap-6 flex-wrap">
      {tonerKeys.map((key) => (
        <CircularGauge
          key={key}
          level={tonerLevels[key]}
          colorConfig={TONER_CONFIG[key]}
        />
      ))}
    </div>
  );
}
