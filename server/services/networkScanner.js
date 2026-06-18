const EvilScan = require('evilscan');

const DEFAULT_OPTIONS = {
  ports: [161, 80, 443, 9100],
  status: 'O',
  timeout: 3000,
  concurrency: 100,
};

function scanNetwork(range, options = {}) {
  return new Promise((resolve, reject) => {
    const targets = [];
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const scanner = new EvilScan({
      target: range,
      port: opts.ports.join(','),
      status: opts.status,
      banner: false,
      timeout: opts.timeout,
      concurrency: opts.concurrency,
    });

    scanner.on('result', (result) => {
      if (result.status === 'open') {
        targets.push({
          ip: result.ip,
          port: result.port,
          status: 'open',
        });
      }
    });

    scanner.on('error', (err) => {
      console.error(`Scan error: ${err.message}`);
    });

    scanner.on('done', () => {
      resolve(aggregateResults(targets));
    });

    scanner.run();
  });
}

function aggregateResults(results) {
  const ipMap = new Map();

  for (const result of results) {
    if (!ipMap.has(result.ip)) {
      ipMap.set(result.ip, {
        ip: result.ip,
        ports: [],
        isPrinter: false,
      });
    }
    const entry = ipMap.get(result.ip);
    entry.ports.push(result.port);

    if (result.port === 161 || result.port === 9100) {
      entry.isPrinter = true;
    }
  }

  return Array.from(ipMap.values());
}

function scanSingleHost(ip, timeout = 3000) {
  return new Promise((resolve) => {
    const results = { ip, ports: [], isAlive: false, isPrinter: false };

    const scanner = new EvilScan({
      target: ip,
      port: '161,80,443,9100',
      status: 'O',
      banner: false,
      timeout,
      concurrency: 10,
    });

    scanner.on('result', (result) => {
      if (result.status === 'open') {
        results.ports.push(result.port);
        results.isAlive = true;
        if (result.port === 161 || result.port === 9100) {
          results.isPrinter = true;
        }
      }
    });

    scanner.on('done', () => resolve(results));
    scanner.run();
  });
}

function validateIPRange(range) {
  const singleIp = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidr = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  const rangeFormat = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;

  if (singleIp.test(range)) return true;
  if (cidr.test(range)) return true;
  if (rangeFormat.test(range)) return true;

  return false;
}

module.exports = { scanNetwork, scanSingleHost, validateIPRange };
