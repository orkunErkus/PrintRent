import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import TonerBar from './TonerBar';

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function DetailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SortIcon({ direction }) {
  return (
    <svg className={`w-4 h-4 inline ${direction ? 'text-primary-600' : 'text-gray-400'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {direction === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : direction === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      )}
    </svg>
  );
}

export default function PrinterTable({ printers = [], loading }) {
  const [sortField, setSortField] = useState('last_seen');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = printers
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.serial_number || '').toLowerCase().includes(q) ||
             (p.ip_address || '').includes(q) ||
             (p.brand || '').toLowerCase().includes(q) ||
             (p.model || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'serial_number': aVal = a.serial_number || ''; bVal = b.serial_number || ''; break;
        case 'brand': aVal = a.brand || ''; bVal = b.brand || ''; break;
        case 'model': aVal = a.model || ''; bVal = b.model || ''; break;
        case 'ip_address': aVal = a.ip_address || ''; bVal = b.ip_address || ''; break;
        case 'total_pages': aVal = a.latestScan?.total_pages || 0; bVal = b.latestScan?.total_pages || 0; break;
        case 'last_seen': default: aVal = a.last_seen || ''; bVal = b.last_seen || ''; break;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  if (loading) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-center py-12">
          <svg className="w-8 h-8 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-3 text-gray-500">Yazıcılar yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz yazıcı bulunamadı</h3>
          <p className="text-sm text-gray-500 mb-4">
            Ağ taraması başlatarak yazıcıları keşfedebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  const SortHeader = ({ field, children }) => (
    <th className="table-header cursor-pointer select-none hover:bg-gray-50"
      onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <SortIcon direction={sortField === field ? sortDir : null} />
      </div>
    </th>
  );

  return (
    <div className="card overflow-hidden">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Yazıcılar
          <span className="ml-2 text-sm font-normal text-gray-500">({filtered.length})</span>
        </h2>
        <input
          type="text"
          placeholder="Seri no, IP, marka veya model ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="is_online">Durum</SortHeader>
              <SortHeader field="serial_number">Seri No</SortHeader>
              <SortHeader field="brand">Marka</SortHeader>
              <SortHeader field="model">Model</SortHeader>
              <SortHeader field="ip_address">IP Adresi</SortHeader>
              <th className="table-header">Toner</th>
              <SortHeader field="total_pages">Sayaç</SortHeader>
              <th className="table-header">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((printer) => (
              <tr key={printer.id}
                className="hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <StatusBadge isOnline={printer.is_online} />
                </td>
                <td className="table-cell font-mono text-xs font-medium text-gray-900">
                  {printer.serial_number || '—'}
                </td>
                <td className="table-cell">
                  <span className="badge bg-primary-50 text-primary-700">
                    {printer.brand || '—'}
                  </span>
                </td>
                <td className="table-cell text-gray-600 max-w-[200px] truncate" title={printer.model}>
                  {printer.model || '—'}
                </td>
                <td className="table-cell">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {printer.ip_address}
                  </code>
                </td>
                <td className="table-cell min-w-[200px]">
                  {printer.latestScan ? (
                    <div className="space-y-1">
                      <TonerBar color="black" level={printer.latestScan.toner_black} showLabel={false} />
                      <div className="flex gap-2">
                        <TonerBar color="cyan" level={printer.latestScan.toner_cyan} showLabel={false} />
                        <TonerBar color="magenta" level={printer.latestScan.toner_magenta} showLabel={false} />
                        <TonerBar color="yellow" level={printer.latestScan.toner_yellow} showLabel={false} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="table-cell">
                  {printer.latestScan ? (
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">
                        {(printer.latestScan.total_pages || 0).toLocaleString()}
                      </span>
                      <div className="text-gray-400">
                        S/B: {(printer.latestScan.bw_pages || 0).toLocaleString()} |
                        Renkli: {(printer.latestScan.color_pages || 0).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <a
                      href={`http://${printer.ip_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary !px-2.5 !py-1.5 text-xs"
                      title="Cihaz Arayüzüne Git"
                    >
                      <ExternalLinkIcon />
                    </a>
                    <Link
                      to={`/printers/${printer.id}`}
                      className="btn-secondary !px-2.5 !py-1.5 text-xs"
                      title="Detayları Gör"
                    >
                      <DetailIcon />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
