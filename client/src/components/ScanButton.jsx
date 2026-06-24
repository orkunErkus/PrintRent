import { useState, useEffect, useRef } from 'react';
import api from '../api';

function ScanIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ScanButton({ onScanComplete, defaultRange = '192.168.1.0/24' }) {
  const [range, setRange] = useState(defaultRange);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = () => {
    setProgress({ current: 0, total: 0, status: 'scanning_network' });
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.getScanProgress();
        setProgress(res);
        if (res.status === 'completed' || res.status === 'error' || res.status === 'idle') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setScanning(false);
          if (res.status === 'completed' && onScanComplete) {
            onScanComplete();
          }
        }
      } catch (err) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setScanning(false);
      }
    }, 1000);
  };

  const handleScan = async () => {
    setScanning(true);
    setResult(null);
    setProgress({ current: 0, total: 0, status: 'starting' });
    startPolling();

    try {
      const res = await api.scanNetwork(range);
      setResult(res);
    } catch (err) {
      if (err.message === 'A scan is already in progress') {
        startPolling();
      } else {
        setResult({ success: false, error: err.message });
        setScanning(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }
  };

  const getStatusText = () => {
    if (!progress) return 'Ağı Tara';
    switch (progress.status) {
      case 'scanning_network': return 'Ağ taranıyor...';
      case 'starting': return 'Başlatılıyor...';
      case 'collecting_data':
        return `Veri toplanıyor (${progress.current}/${progress.total})...`;
      case 'completed': return 'Tarama tamamlandı!';
      case 'error': return 'Hata oluştu';
      default: return 'Ağı Tara';
    }
  };

  const isScanning = scanning && progress?.status !== 'completed' && progress?.status !== 'error';

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="network-range" className="block text-xs font-medium text-gray-500 mb-1">
              Ağ Aralığı (CIDR)
            </label>
            <input
              id="network-range"
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="192.168.1.0/24"
              className="input-field"
              disabled={isScanning}
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning || !range.trim()}
            className="btn-primary mt-1 sm:mt-5"
          >
            {isScanning ? <LoadingIcon /> : <ScanIcon />}
            {getStatusText()}
          </button>
        </div>

        {isScanning && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress?.status === 'scanning_network' ? 'Ağ taranıyor...' : 'Veri toplanıyor'}</span>
              {progress?.total > 0 ? (
                <span>{progress.current} / {progress.total}</span>
              ) : (
                <span className="text-primary-500 animate-pulse">taranıyor...</span>
              )}
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
              {progress?.total > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              ) : (
                <div className="h-full w-full absolute inset-0 overflow-hidden rounded-full">
                  <div className="h-full w-1/3 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                      animation: 'indeterminate 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              )}
            </div>
            <style>{`@keyframes indeterminate{0%{transform:translateX(-150%)}100%{transform:translateX(350%)}}`}</style>
          </div>
        )}

        {result && !isScanning && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            result.success !== false
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result.success !== false
              ? `✓ Tarama tamamlandı. ${result.totalFound} yazıcı bulundu, ${result.totalFailed} cihazda hata oluştu.`
              : `✗ ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
}
