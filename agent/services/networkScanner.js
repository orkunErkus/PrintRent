const EvilScan = require('evilscan');

async function scanNetwork(range) {
  return new Promise((resolve) => {
    const targets = [];
    const scanner = new EvilScan({ target: range, port: '161,80,443,9100', status: 'O', banner: false, timeout: 3000, concurrency: 100 });
    scanner.on('result', (r) => { if (r.status === 'open') targets.push({ ip: r.ip, port: r.port }); });
    scanner.on('done', () => {
      const map = new Map();
      targets.forEach(t => {
        if (!map.has(t.ip)) map.set(t.ip, { ip: t.ip, ports: [], isPrinter: false });
        const e = map.get(t.ip);
        e.ports.push(t.port);
        if (t.port === 161 || t.port === 9100) e.isPrinter = true;
      });
      resolve(Array.from(map.values()));
    });
    scanner.run();
  });
}

function validateIPRange(range) {
  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(range) || /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/.test(range);
}

module.exports = { scanNetwork, validateIPRange };
