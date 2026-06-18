import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import TonerGauge from '../components/TonerGauge';
import CounterHistoryChart from '../components/CounterHistoryChart';

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('tr-TR');
}

export default function PrinterDetail() {
  const { id } = useParams();
  const [printer, setPrinter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPrinter(id)
      .then(res => setPrinter(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-8 h-8 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-3 text-gray-500">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="btn-primary">Dashboard'a Dön</Link>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Yazıcı bulunamadı</p>
        <Link to="/" className="btn-primary">Dashboard'a Dön</Link>
      </div>
    );
  }

  const latestHistory = printer.history?.[0] || {};
  const tonerLevels = {
    black: latestHistory.toner_black,
    cyan: latestHistory.toner_cyan,
    magenta: latestHistory.toner_magenta,
    yellow: latestHistory.toner_yellow,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="btn-secondary">
          <BackIcon />
          Geri Dön
        </Link>
        <a
          href={`http://${printer.ip_address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <ExternalLinkIcon />
          Cihaz Arayüzüne Git
        </a>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {printer.brand || 'Bilinmeyen'} {printer.model || ''}
                </h1>
                <StatusBadge isOnline={printer.is_online} />
              </div>
              <p className="text-sm text-gray-500">
                Seri No: <span className="font-mono font-medium text-gray-700">{printer.serial_number || '—'}</span>
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>IP: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{printer.ip_address}</code></p>
              <p className="mt-1">Son Görülme: {formatDate(printer.last_seen)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Sarf Malzeme Durumu</h3>
          </div>
          <div className="card-body">
            <TonerGauge tonerLevels={tonerLevels} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Sayaç Bilgileri</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Toplam', value: latestHistory.total_pages, color: 'text-blue-600' },
                { label: 'S/B', value: latestHistory.bw_pages, color: 'text-gray-600' },
                { label: 'Renkli', value: latestHistory.color_pages, color: 'text-yellow-600' },
              ].map(item => (
                <div key={item.label} className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CounterHistoryChart data={printer.chartData || []} />

      {printer.history && printer.history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Tarama Geçmişi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Tarih</th>
                  <th className="table-header">Toplam</th>
                  <th className="table-header">S/B</th>
                  <th className="table-header">Renkli</th>
                  <th className="table-header">Siyah Toner</th>
                  <th className="table-header">Cyan</th>
                  <th className="table-header">Magenta</th>
                  <th className="table-header">SarÄ±</th>
                  <th className="table-header">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {printer.history.slice(0, 20).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs text-gray-500">
                      {formatDate(record.scanned_at)}
                    </td>
                    <td className="table-cell font-medium">{formatNumber(record.total_pages)}</td>
                    <td className="table-cell">{formatNumber(record.bw_pages)}</td>
                    <td className="table-cell">{formatNumber(record.color_pages)}</td>
                    <td className="table-cell">{record.toner_black !== null ? `${record.toner_black}%` : '—'}</td>
                    <td className="table-cell">{record.toner_cyan !== null ? `${record.toner_cyan}%` : '—'}</td>
                    <td className="table-cell">{record.toner_magenta !== null ? `${record.toner_magenta}%` : '—'}</td>
                    <td className="table-cell">{record.toner_yellow !== null ? `${record.toner_yellow}%` : '—'}</td>
                    <td className="table-cell">
                      <StatusBadge isOnline={record.is_online} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
