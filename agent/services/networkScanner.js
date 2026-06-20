const EvilScan = require('evilscan');

const DEFAULT_OPTIONS = { ports: [161, 80, 443, 9100], status: 'O', timeout: 3000, concurrency: 100 };

function scanNetwork(range, options = {}) {
  return new Promise((resolve, reject) => {
    const targets = [];
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const scanner = new EvilScan({
      target: range, port: opts.ports.join(','), status: opts.status,
      banner: false, timeout: opts.timeout, concurrency: opts.concurrency,
    });
    scanner.on('result', (result) => {
      if (result.status === 'open') targets.push({ ip: result.ip, port: result.port, status: 'open' });
    });
    scanner.on('error', (err) => console.error(`Scan error: ${err.message}`));
    scanner.on('done', () => resolve(aggregateResults(targets)));
    scanner.run();
  });
}

function aggregateResults(results) {
  const ipMap = new Map();
  for (const result of results) {
    if (!ipMap.has(result.ip)) ipMap.set(result.ip, { ip: result.ip, ports: [], isPrinter: false });
    const entry = ipMap.get(result.ip);
    entry.ports.push(result.port);
    if (result.port === 161 || result.port === 9100) entry.isPrinter = true;
  }
  return Array.from(ipMap.values());
}

function validateIPRange(range) {
  const singleIp = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidr = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  const rangeFormat = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
  return singleIp.test(range) || cidr.test(range) || rangeFormat.test(range);
}

module.exports = { scanNetwork, validateIPRange };
