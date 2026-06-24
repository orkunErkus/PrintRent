const snmp = require('net-snmp');
const { SNMP_OIDS, SUPPLY_TYPES } = require('../config/snmp-oids');

const SNMP_OPTIONS = {
  port: 161,
  retries: 1,
  timeout: 3000,
  backoff: 1.0,
  version: snmp.Version2c,
};

function createSession(ip, community = 'public') {
  return snmp.createSession(ip, community, SNMP_OPTIONS);
}

function getOID(session, oid) {
  return new Promise((resolve, reject) => {
    session.get([oid], (error, varbinds) => {
      if (error) {
        reject(error);
        return;
      }
      if (varbinds && varbinds[0]) {
        const vb = varbinds[0];
        if (snmp.isVarbindError(vb)) {
          reject(new Error(`SNMP OID Error for ${oid}: ${vb}`));
        } else {
          resolve(vb.value);
        }
      } else {
        resolve(null);
      }
    });
  });
}

function walkOID(session, oid, maxRepetitions = 50) {
  return new Promise((resolve, reject) => {
    const results = [];
    session.walk(oid, maxRepetitions, (error, varbinds) => {
      if (error) {
        reject(error);
        return;
      }
      for (const vb of varbinds) {
        if (!snmp.isVarbindError(vb)) {
          results.push({
            oid: vb.oid,
            value: vb.value,
            type: vb.type,
          });
        }
      }
    }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function getSystemInfo(ip) {
  const session = createSession(ip);
  try {
    const [description, name, location, uptime] = await Promise.all([
      getOID(session, SNMP_OIDS.system.description).catch(() => null),
      getOID(session, SNMP_OIDS.system.name).catch(() => null),
      getOID(session, SNMP_OIDS.system.location).catch(() => null),
      getOID(session, SNMP_OIDS.system.uptime).catch(() => null),
    ]);

    return {
      description: description ? description.toString() : null,
      hostname: name ? name.toString() : null,
      location: location ? location.toString() : null,
      uptime: uptime || null,
    };
  } finally {
    session.close();
  }
}

async function getSerialNumber(ip) {
  const session = createSession(ip);
  try {
    const serial = await getOID(session, SNMP_OIDS.printer.general.serialNumber);
    if (serial) {
      return serial.toString().trim();
    }

    const vendorOIDs = [
      { name: 'hp', oid: SNMP_OIDS.vendor.hp.serialNumber },
      { name: 'brother', oid: SNMP_OIDS.vendor.brother.serialNumber },
      { name: 'epson', oid: SNMP_OIDS.vendor.epson.serialNumber },
      { name: 'canon', oid: SNMP_OIDS.vendor.canon.serialNumber },
      { name: 'ricoh', oid: SNMP_OIDS.vendor.ricoh.serialNumber },
      { name: 'xerox', oid: SNMP_OIDS.vendor.xerox.serialNumber },
      { name: 'xerox2', oid: SNMP_OIDS.vendor.xerox.serialNumber2 },
      { name: 'xerox3', oid: SNMP_OIDS.vendor.xerox.serialNumber3 },
      { name: 'xerox4', oid: SNMP_OIDS.vendor.xerox.serialNumber4 },
      { name: 'lexmark', oid: SNMP_OIDS.vendor.lexmark.serialNumber },
      { name: 'kyocera', oid: SNMP_OIDS.vendor.kyocera.serialNumber },
      { name: 'sharp', oid: SNMP_OIDS.vendor.sharp.serialNumber },
      { name: 'toshiba', oid: SNMP_OIDS.vendor.toshiba.serialNumber },
      { name: 'panasonic', oid: SNMP_OIDS.vendor.panasonic.serialNumber },
      { name: 'oki', oid: SNMP_OIDS.vendor.oki.serialNumber },
      { name: 'konicaMinolta', oid: SNMP_OIDS.vendor.konicaMinolta.serialNumber },
      { name: 'entPhysical', oid: SNMP_OIDS.entity.physicalSerialNum },
    ];

    for (const vendor of vendorOIDs) {
      try {
        const value = await getOID(session, vendor.oid);
        if (value && value.toString().trim().length > 0) {
          return value.toString().trim();
        }
      } catch (e) {
        // continue
      }
    }

    const walkTables = async () => {
      const toWalk = [SNMP_OIDS.entity.physicalSerialNum.replace(/\.\d+$/, ''), '1.3.6.1.2.1.43.5.1.1'];
      for (const base of toWalk) {
        try {
          const entries = await walkOID(session, base);
          for (const e of entries) {
            const val = e.value?.toString()?.trim();
            if (val && val.length > 3 && val.length < 64 && !/^[\d\s]+$/.test(val)) {
              return val;
            }
          }
        } catch {}
      }
      return null;
    };

    return walkTables();
  } finally {
    session.close();
  }
}

async function getTonerLevels(ip) {
  const session = createSession(ip);
  try {
    const supplies = await walkOID(session, SNMP_OIDS.printer.supply.levels);
    const maxCapacities = await walkOID(session, SNMP_OIDS.printer.supply.maxCapacity);
    const descriptions = await walkOID(session, SNMP_OIDS.printer.supply.description);
    const types = await walkOID(session, SNMP_OIDS.printer.supply.type);

    const suppliesMap = new Map();
    const maxMap = new Map();
    const descMap = new Map();
    const typeMap = new Map();

    for (const s of supplies) {
      const idx = s.oid.split('.').pop();
      suppliesMap.set(idx, s.value);
    }
    for (const m of maxCapacities) {
      const idx = m.oid.split('.').pop();
      maxMap.set(idx, m.value);
    }
    for (const d of descriptions) {
      const idx = d.oid.split('.').pop();
      descMap.set(idx, d.value ? d.value.toString() : '');
    }
    for (const t of types) {
      const idx = t.oid.split('.').pop();
      typeMap.set(idx, t.value);
    }

    const tonerLevels = {};
    let wasteLevel = null;

    for (const [idx, level] of suppliesMap) {
      const maxVal = maxMap.get(idx) || 100;
      const desc = descMap.get(idx) || '';
      const type = typeMap.get(idx);
      const typeName = SUPPLY_TYPES[type] || 'Unknown';
      const descLower = desc.toLowerCase();

      const percentage = maxVal > 0 ? Math.round((level / maxVal) * 100) : 0;

      if (type === 3 || type === 5 || type === 6) {
        if (descLower.includes('black') || descLower.includes('siyah') || descLower.includes('k') ||
            descLower.includes('bk') || (!descLower.includes('cyan') && !descLower.includes('magenta') &&
            !descLower.includes('yellow') && !descLower.includes('sarı') && !descLower.includes('mavi') &&
            !descLower.includes('kırmızı') && !descLower.includes('foto') && Object.keys(tonerLevels).length === 0)) {
          if (!tonerLevels.black || tonerLevels.black === 0) {
            tonerLevels.black = percentage;
          }
        } else if (descLower.includes('cyan') || descLower.includes('c') || descLower.includes('mavi')) {
          tonerLevels.cyan = percentage;
        } else if (descLower.includes('magenta') || descLower.includes('m') || descLower.includes('kırmızı')) {
          tonerLevels.magenta = percentage;
        } else if (descLower.includes('yellow') || descLower.includes('y') || descLower.includes('sarı')) {
          tonerLevels.yellow = percentage;
        } else {
          if (!tonerLevels.black) tonerLevels.black = percentage;
        }
      }

      if (type === 4 || type === 8) {
        wasteLevel = percentage;
      }
    }

    return { tonerLevels, wasteLevel };
  } finally {
    session.close();
  }
}

async function getPageCounts(ip) {
  const session = createSession(ip);
  try {
    const markers = await walkOID(session, SNMP_OIDS.printer.marker.lifeCount);

    let totalPages = 0;
    let bwPages = 0;
    let colorPages = 0;

    for (const marker of markers) {
      const value = typeof marker.value === 'number' ? marker.value : parseInt(marker.value) || 0;
      totalPages += value;

      const markerIdx = marker.oid.split('.').pop();
      if (markerIdx === '1') {
        bwPages += value;
      } else {
        colorPages += value;
      }
    }

    if (totalPages === 0) {
      const vendorBWOIDs = [
        SNMP_OIDS.vendor.hp.totalBW,
        SNMP_OIDS.vendor.brother.totalBW,
        SNMP_OIDS.vendor.canon.totalBW,
        SNMP_OIDS.vendor.ricoh.totalBW,
        SNMP_OIDS.vendor.kyocera.totalBW,
        SNMP_OIDS.vendor.konicaMinolta.totalBW,
      ];
      const vendorColorOIDs = [
        SNMP_OIDS.vendor.hp.totalColor,
        SNMP_OIDS.vendor.brother.totalColor,
        SNMP_OIDS.vendor.canon.totalColor,
        SNMP_OIDS.vendor.ricoh.totalColor,
        SNMP_OIDS.vendor.kyocera.totalColor,
        SNMP_OIDS.vendor.konicaMinolta.totalColor,
      ];
      const vendorTotalOIDs = [
        SNMP_OIDS.vendor.epson.totalPages,
        SNMP_OIDS.vendor.xerox.totalPages,
        SNMP_OIDS.vendor.lexmark.totalPages,
        SNMP_OIDS.vendor.sharp.totalPages,
        SNMP_OIDS.vendor.toshiba.totalPages,
        SNMP_OIDS.vendor.panasonic.totalPages,
        SNMP_OIDS.vendor.oki.totalPages,
      ];

      for (const oid of vendorBWOIDs) {
        try {
          const val = await getOID(session, oid);
          if (val) { bwPages = parseInt(val) || 0; break; }
        } catch (e) { /* continue */ }
      }
      for (const oid of vendorColorOIDs) {
        try {
          const val = await getOID(session, oid);
          if (val) { colorPages = parseInt(val) || 0; break; }
        } catch (e) { /* continue */ }
      }

      totalPages = bwPages + colorPages;
      if (totalPages === 0) {
        for (const oid of vendorTotalOIDs) {
          try {
            const val = await getOID(session, oid);
            if (val) { totalPages = parseInt(val) || 0; break; }
          } catch (e) { /* continue */ }
        }
        if (totalPages > 0 && bwPages === 0 && colorPages === 0) {
          bwPages = totalPages;
        }
      }
    }

    return { totalPages, bwPages, colorPages };
  } finally {
    session.close();
  }
}

async function getModelInfo(ip) {
  const session = createSession(ip);
  try {
    const hostResources = await walkOID(session, SNMP_OIDS.host.deviceDescr);

    for (const resource of hostResources) {
      const desc = resource.value ? resource.value.toString() : '';
      if (desc.toLowerCase().includes('printer') || desc.toLowerCase().includes('print')) {
        return desc;
      }
    }

    if (hostResources.length > 0) {
      return hostResources[0].value ? hostResources[0].value.toString() : null;
    }

    const sysDescr = await getOID(session, SNMP_OIDS.system.description).catch(() => null);
    return sysDescr ? sysDescr.toString() : null;
  } finally {
    session.close();
  }
}

function detectBrand(modelInfo) {
  if (!modelInfo) return null;
  const lower = modelInfo.toLowerCase();

  const brandMap = [
    { name: 'HP', keywords: ['hp', 'hewlett', 'packard', 'laserjet', 'officejet', 'deskjet', 'color laserjet'] },
    { name: 'Epson', keywords: ['epson', 'stylus', 'workforce', 'surecolor', 'l series', 'ecotank'] },
    { name: 'Canon', keywords: ['canon', 'pixma', 'imageclass', 'image runner', 'imagerunner', 'lbp', 'ir '] },
    { name: 'Brother', keywords: ['brother', 'hl-', 'dcp-', 'mfc-', 'faz-'] },
    { name: 'Ricoh', keywords: ['ricoh', 'savin', 'gestetner', 'lanier', 'aficio'] },
    { name: 'Xerox', keywords: ['xerox', 'phaser', 'workcentre', 'docucentre', 'versalink'] },
    { name: 'Lexmark', keywords: ['lexmark', 'ms', 'mx', 'cs', 'cx', 'b', 'c'] },
    { name: 'Kyocera', keywords: ['kyocera', 'kyocera mita', 'ecosys', 'fs-', 'cs-', 'ta'] },
    { name: 'Sharp', keywords: ['sharp', 'mx-', 'ar-'] },
    { name: 'Toshiba', keywords: ['toshiba', 'e-studio', 'estudio'] },
    { name: 'Panasonic', keywords: ['panasonic', 'kx-', 'dp-'] },
    { name: 'OKI', keywords: ['oki', 'okidata', 'okipage', 'c', 'mc'] },
    { name: 'Konica Minolta', keywords: ['konica', 'minolta', 'bizhub', 'bizhub'] },
  ];

  for (const brand of brandMap) {
    for (const keyword of brand.keywords) {
      if (lower.includes(keyword)) return brand.name;
    }
  }

  return 'Unknown';
}

async function collectAllPrinterData(ip) {
  let isAlive = false;
  try {
    const session = createSession(ip);
    await getOID(session, SNMP_OIDS.system.description);
    session.close();
    isAlive = true;
  } catch (e) {
    return { ip, isAlive: false, error: 'SNMP not available' };
  }

  try {
    const [systemInfo, serialNumber, modelInfo, tonerData, pageCounts] = await Promise.all([
      getSystemInfo(ip),
      getSerialNumber(ip),
      getModelInfo(ip),
      getTonerLevels(ip),
      getPageCounts(ip),
    ]);

    const brand = detectBrand(modelInfo || systemInfo.description);

    return {
      ip,
      isAlive: true,
      serialNumber,
      hostname: systemInfo.hostname,
      location: systemInfo.location,
      description: systemInfo.description,
      model: modelInfo || systemInfo.description,
      brand,
      ...tonerData,
      ...pageCounts,
      rawData: {
        systemInfo,
        modelInfo,
      },
    };
  } catch (error) {
    return {
      ip,
      isAlive: false,
      error: error.message,
    };
  }
}

module.exports = {
  collectAllPrinterData,
  getSystemInfo,
  getSerialNumber,
  getTonerLevels,
  getPageCounts,
  getModelInfo,
  detectBrand,
};
