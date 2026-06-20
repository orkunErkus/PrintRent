import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import ScanButton from '../components/ScanButton';
import PrinterTable from '../components/PrinterTable';

function PrinterIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CounterIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
        <Icon />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [printers, setPrinters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [printersRes, statsRes] = await Promise.all([
        api.getPrinters(),
        api.getStats(),
      ]);
      setPrinters(printersRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
            {isAdmin && (
              <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium align-middle">
                Admin
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Yazici yonetim paneli — {isAdmin ? 'Tum kullanicilara ait yazicilar' : 'Size ait yazicilar'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshIcon />
          Yenile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={PrinterIcon}
            label="Toplam Yazici"
            value={stats.totalPrinters}
            color="primary"
          />
          <StatCard
            icon={OnlineIcon}
            label="Cevrimici"
            value={stats.onlinePrinters}
            sub={`${stats.offlinePrinters} cevrimdisi`}
            color="green"
          />
          <StatCard
            icon={OfflineIcon}
            label="Cevrimdisi"
            value={stats.offlinePrinters}
            color="red"
          />
          <StatCard
            icon={CounterIcon}
            label="Toplam Sayac"
            value={stats.totalPages?.toLocaleString() || '0'}
            sub={`S/B: ${stats.totalBW?.toLocaleString() || '0'} | Renkli: ${stats.totalColor?.toLocaleString() || '0'}`}
            color="yellow"
          />
        </div>
      )}

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Yerel Agdaki Yazicilari Tarama
        </div>
        <p className="text-xs text-amber-700">
          Bu sayfa bulut sunucusunda. Yazicilara ulasmak icin yerel bilgisayardaki PrintRent Agent'a baglanin.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            id="agentIp"
            placeholder="192.168.1.100"
            className="input font-mono text-sm flex-1"
          />
          <button
            onClick={() => {
              const ip = document.getElementById('agentIp')?.value;
              if (ip) window.open(`http://${ip}:3001`, '_blank');
            }}
            className="btn-primary text-sm px-5 py-2 whitespace-nowrap"
          >
            Baglan
          </button>
        </div>
        <div className="text-xs text-amber-500">
          Agent baslatmak: <code className="bg-amber-100 px-1 rounded">start.bat</code>'a cift tikla
        </div>
      </div>

      <ScanButton onScanComplete={fetchData} />

      <PrinterTable printers={printers} loading={loading} />
    </div>
  );
}
