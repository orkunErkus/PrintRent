import { useState } from 'react';

const SUBNETS = ['192.168.1.', '192.168.0.', '10.0.0.', '172.16.0.', '127.0.0.'];

export default function LocalRedirectCard() {
  const [prefix, setPrefix] = useState('192.168.1.');
  const [lastOctet, setLastOctet] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [checking, setChecking] = useState(false);

  const fullIp = prefix + lastOctet;
  const isValid = fullIp.match(/^\d+\.\d+\.\d+\.\d+$/);
  const url = isValid ? `http://${fullIp}:3001` : null;

  const handleConnect = async () => {
    if (!url) return;
    setChecking(true);
    setShowWarning(false);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/api/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        window.open(url, '_blank');
      } else {
        setShowWarning(true);
      }
    } catch {
      setShowWarning(true);
    } finally {
      setChecking(false);
    }
  };

  const handleForceConnect = () => {
    if (!url) return;
    window.open(url, '_blank');
    setShowWarning(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Yerel Agdaki Yazicilari Taramak Icin
      </div>

      <p className="text-xs text-amber-700">
        PrintRent Agent'i yazicilarin oldugu agdaki bir bilgisayarda calistirin.
        O bilgisayarin IP'sini asagidan girin.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {SUBNETS.map(s => (
          <button key={s} onClick={() => setPrefix(s)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors ${
              prefix === s ? 'bg-amber-200 border-amber-400 text-amber-900 font-bold' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >{s}x</button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center font-mono text-sm bg-white border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-800 font-bold min-w-[90px]">{prefix}</span>
          <input
            type="text"
            placeholder="100"
            value={lastOctet}
            onChange={e => setLastOctet(e.target.value.replace(/\D/g, '').slice(0, 3))}
            className="flex-1 outline-none bg-transparent text-amber-900 font-mono"
            maxLength={3}
            onKeyDown={e => { if (e.key === 'Enter' && url) handleConnect(); }}
          />
        </div>
        <button onClick={handleConnect}
          disabled={!url || checking}
          className={`btn-primary text-sm px-5 py-2 rounded-lg font-semibold whitespace-nowrap inline-flex items-center ${(!url || checking) ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {checking ? 'Kontrol ediliyor...' : 'Baglan'}
        </button>
      </div>

      {showWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 space-y-3">
          <p className="font-semibold">{fullIp} adresinde PrintRent Agent bulunamadi!</p>
          <p>Agent calismiyor olabilir veya guvenlik duvari engelliyor olabilir.</p>
          <div className="flex gap-2">
            <a href="/agent/printrent-agent.zip" download
              className="btn-primary text-sm px-4 py-2 rounded-lg inline-block text-center"
            >
              Agent'i Indir
            </a>
            <button onClick={handleForceConnect}
              className="btn-secondary text-sm px-4 py-2 rounded-lg font-semibold"
            >
              Yine de Baglan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
