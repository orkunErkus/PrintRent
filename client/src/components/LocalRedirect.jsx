import { useState, useEffect } from 'react';

function getLocalIP() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        const m = ice.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) { pc.close(); resolve(m[1]); }
      };
      setTimeout(() => { pc.close(); resolve(null); }, 2000);
    } catch { resolve(null); }
  });
}

function getHostingerBase() {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export default function LocalRedirect() {
  const [ip, setIp] = useState(null);
  const [manual, setManual] = useState('');
  const [mode, setMode] = useState('idle'); // idle | detected | manual
  const hostingerUrl = getHostingerBase();

  useEffect(() => {
    if (!isLocalHost(window.location.hostname)) {
      getLocalIP().then(found => {
        if (found) {
          setIp(found);
          setMode('detected');
        } else {
          setMode('manual');
        }
      });
    }
  }, []);

  if (isLocalHost(window.location.hostname)) return null;

  if (mode === 'idle') return null;

  const localUrl = ip ? `http://${ip}:3001` : null;
  const manualUrl = manual ? `http://${manual}:3001` : null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-800 font-semibold">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Yerel Agdaki Yazicilari Taramak Icin
      </div>
      <p className="text-sm text-amber-700">
        Bu sayfa bulut sunucusunda calisiyor. Yazicilarin bagli oldugu yerel agdaki
        bilgisayarda PrintRent Agent calistirin, sonra asagidaki adrese gidin.
      </p>

      {mode === 'detected' && localUrl && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white rounded-lg p-3 border border-amber-200">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-gray-500">Algilanan yerel adres</div>
            <div className="font-mono font-bold text-amber-900 text-lg">{localUrl}</div>
          </div>
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-center px-6 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap"
          >
            Baglan
          </a>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-2">
          <p className="text-xs text-amber-600 font-medium">
            Yerel IP otomatik tespit edilemedi. PrintRent Agent'in calistigi
            bilgisayarin IP'sini girin:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="192.168.1.100"
              value={manual}
              onChange={e => setManual(e.target.value)}
              className="input flex-1 font-mono text-sm"
            />
            {manualUrl && (
              <a
                href={manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              >
                Baglan
              </a>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-amber-500 border-t border-amber-200 pt-3 mt-2">
        Agent'i baslatmak icin: <code className="bg-amber-100 px-1 rounded">start.bat</code> dosyasina cift tiklayin.
        &nbsp;Alternatif: <code className="bg-amber-100 px-1 rounded">cd agent {'&amp;&amp;'} node agent.js</code>
      </div>
    </div>
  );
}
