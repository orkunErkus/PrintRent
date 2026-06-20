import { useState, useEffect } from 'react';

function detectLocalIP() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(o => pc.setLocalDescription(o));
      pc.onicecandidate = (ice) => {
        if (!ice?.candidate?.candidate) return;
        const m = ice.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) { pc.close(); resolve(m[1]); }
      };
      setTimeout(() => { try { pc.close(); } catch {} resolve(null); }, 2000);
    } catch { resolve(null); }
  });
}

export default function LocalRedirectCard() {
  const [ip, setIp] = useState('');
  const [detecting, setDetecting] = useState(true);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    detectLocalIP().then(found => {
      if (found) { setIp(found); setDetected(true); }
      setDetecting(false);
    });
  }, []);

  const url = ip ? `http://${ip}:3001` : null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Yerel Agdaki Yazicilari Taramak Icin
      </div>

      <p className="text-xs text-amber-700">
        Yazicilarin bagli oldugu yerel agdaki bilgisayarda PrintRent Agent calistirin.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="192.168.1.100"
          value={ip}
          onChange={e => { setIp(e.target.value); setDetected(false); }}
          className="input font-mono text-sm flex-1"
          onKeyDown={e => { if (e.key === 'Enter' && ip) window.open(`http://${ip}:3001`, '_blank'); }}
        />
        <button
          onClick={() => { if (ip) window.open(`http://${ip}:3001`, '_blank'); }}
          className="btn-primary text-sm px-5 py-2 whitespace-nowrap"
          disabled={!ip}
        >
          Baglan
        </button>
      </div>

      {detecting && <p className="text-xs text-amber-500">IP algilaniyor...</p>}

      {detected && (
        <p className="text-xs text-green-600">
          IP otomatik algilandi. Agent calismiyorsa IP'yi manuel de girip tekrar deneyebilirsin.
        </p>
      )}

      {!detecting && !detected && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-amber-600">IP otomatik bulunamadi.</p>
          <button
            onClick={async () => {
              setDetecting(true);
              const found = await detectLocalIP();
              if (found) { setIp(found); setDetected(true); }
              setDetecting(false);
            }}
            className="text-xs text-amber-700 underline"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="text-xs text-amber-500">
        Agent baslatmak: yerel bilgisayarda <code className="bg-amber-100 px-1 rounded">cd agent &amp;&amp; node agent.js</code>
      </div>
    </div>
  );
}
