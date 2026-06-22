export function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('PWA: Service Worker not supported');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA: Service Worker registered', reg.scope);
        reg.update();

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('PWA: New service worker installing');
          newWorker.addEventListener('statechange', () => {
            console.log('PWA: SW state:', newWorker.state);
            if (newWorker.state === 'activated') {
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.error('PWA: Registration failed:', err);
      });
  });
}
