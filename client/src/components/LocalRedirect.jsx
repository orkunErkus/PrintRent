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

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.16.');
}

export default function LocalRedirect() {
  const [ip, setIp] = useState(null);
  const [manual, setManual] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLocalHost(window.location.hostname)) {
      getLocalIP().then(setIp);
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const localUrl = ip ? `http://${ip}:3001` : null;
  const manualUrl = manual ? `http://${manual}:3001` : null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Yerel Ağdaki PrintRent'e Bağlan
      </div>
      <p className="text-xs text-amber-700">
        Bulut sunucusu yerel ağdaki yazıcıları tarayamaz. Aynı ağdaki bir bilgisayarda
        PrintRent çalışıyorsa aşağıdaki adresi kullanın.
      </p>
      {localUrl ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-white px-3 py-1.5 rounded border text-amber-900 flex-1">
            {localUrl}
          </span>
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm px-4 py-1.5"
          >
            Bağlan
          </a>
        </div>
      ) : (
        <div className="text-xs text-amber-600">
          Yerel IP tespit edilemedi. Aşağıya manuel girin:
        </div>
      )}
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
            className="btn-secondary text-sm px-4 py-1.5"
          >
            Bağlan
          </a>
        )}
      </div>
    </div>
  );
}
