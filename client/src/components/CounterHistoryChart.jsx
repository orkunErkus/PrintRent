import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

const TONER_COLOR_MAP = {
  toner_black: '#1f2937',
  toner_cyan: '#06b6d4',
  toner_magenta: '#ec4899',
  toner_yellow: '#eab308',
};

const CHART_CONFIG = [
  { key: 'total_pages', label: 'Toplam Sayaç', color: '#3b82f6' },
  { key: 'bw_pages', label: 'S/B Sayaç', color: '#6b7280' },
  { key: 'color_pages', label: 'Renkli Sayaç', color: '#f59e0b' },
];

export default function CounterHistoryChart({ data = [] }) {
  const [chartType, setChartType] = useState('counter');

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center py-12">
          <span className="text-gray-400">Geçmiş verisi bulunamadı</span>
        </div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    formattedDate: formatDate(d.scanned_at),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Sayaç Geçmişi</h3>
        <div className="flex gap-1">
          {['counter', 'toner'].map(type => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                chartType === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {type === 'counter' ? 'Sayaçlar' : 'Toner'}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        {chartType === 'counter' ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {CHART_CONFIG.map(cfg => (
                <Line
                  key={cfg.key}
                  type="monotone"
                  dataKey={cfg.key}
                  name={cfg.label}
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {Object.entries(TONER_COLOR_MAP).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key === 'toner_black' ? 'Siyah' : key === 'toner_cyan' ? 'Cyan' : key === 'toner_magenta' ? 'Magenta' : 'Sarı'}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
