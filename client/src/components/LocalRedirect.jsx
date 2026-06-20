import { useState } from 'react';

export default function LocalRedirect() {
  const [manual, setManual] = useState('192.168.1');

  const ipParts = manual.split('.').filter(Boolean);
  const suggestions = [];
  if (ipParts.length >= 3 && ipParts.length <= 4) {
    const base = ipParts.slice(0, 3).join('.');
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${base}.${i}`);
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-800 font-semibold">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Yerel Agdaki Yazicilari Tarama
      </div>
      <p className="text-sm text-amber-700">
        Bu sayfa bulut sunucusunda calisiyor. Yazicilarin oldugu yerel agdaki
        bilgisayara gecmek icin IP'sini girin:
      </p>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="192.168.1.100"
          value={manual}
          onChange={e => setManual(e.target.value)}
          className="input font-mono text-sm w-full"
        />
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(ip => (
            <button
              key={ip}
              onClick={() => setManual(ip)}
              className={`px-2 py-1 text-xs rounded font-mono border transition-colors ${
                manual === ip
                  ? 'bg-amber-200 border-amber-400 text-amber-900'
                  : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {ip}
            </button>
          ))}
        </div>
      </div>

      {manual && (
        <a
          href={`http://${manual}:3001`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary block text-center px-6 py-2.5 rounded-lg text-sm font-semibold"
        >
          http://{manual}:3001 Adresine Git
        </a>
      )}

      <div className="text-xs text-amber-500 border-t border-amber-200 pt-3">
        Agent'i baslatmak icin yerel bilgisayarda <code className="bg-amber-100 px-1 rounded">start.bat</code>'a cift tiklayin.
      </div>
    </div>
  );
}
