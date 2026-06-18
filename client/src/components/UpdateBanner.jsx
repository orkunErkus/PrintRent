import { useState, useEffect } from 'react';

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function usePwaUpdate() {
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
          }
        });
      });
    });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  }, []);

  const skipWaiting = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ action: 'skipWaiting' });
    }
  };

  return { hasUpdate: !!waitingWorker, skipWaiting };
}

export default function UpdateBanner() {
  const { hasUpdate, skipWaiting } = usePwaUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-primary-600 text-white rounded-xl shadow-2xl flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse shrink-0" />
          <p className="text-sm font-medium truncate">
            Yeni sürüm mevcut — güncellemek için yenileyin
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={skipWaiting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary-700 rounded-lg text-xs font-semibold hover:bg-primary-50 transition-colors"
          >
            <RefreshIcon />
            Yenile
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-primary-500 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
