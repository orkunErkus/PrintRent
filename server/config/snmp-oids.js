const SNMP_OIDS = {
  system: {
    description: '1.3.6.1.2.1.1.1.0',
    uptime: '1.3.6.1.2.1.1.3.0',
    contact: '1.3.6.1.2.1.1.4.0',
    name: '1.3.6.1.2.1.1.5.0',
    location: '1.3.6.1.2.1.1.6.0',
  },

  host: {
    deviceDescr: '1.3.6.1.2.1.25.3.2.1.3',
    deviceStatus: '1.3.6.1.2.1.25.3.2.1.5',
    deviceType: '1.3.6.1.2.1.25.3.2.1.2',
  },

  printer: {
    general: {
      serialNumber: '1.3.6.1.2.1.43.5.1.1.17',
      model: '1.3.6.1.2.1.25.3.2.1.3',
      manufacturer: '1.3.6.1.2.1.25.3.2.1.3',
    },
    marker: {
      lifeCount: '1.3.6.1.2.1.43.10.2.1.4',
      counterUnit: '1.3.6.1.2.1.43.10.2.1.2',
      markerTech: '1.3.6.1.2.1.43.10.2.1.5',
      markerColorantTable: '1.3.6.1.2.1.43.12.1.1',
    },
    supply: {
      levels: '1.3.6.1.2.1.43.11.1.1.9',
      maxCapacity: '1.3.6.1.2.1.43.11.1.1.8',
      description: '1.3.6.1.2.1.43.11.1.1.6',
      type: '1.3.6.1.2.1.43.11.1.1.5',
      colorantIndex: '1.3.6.1.2.1.43.11.1.1.4',
      class: '1.3.6.1.2.1.43.11.1.1.3',
      unit: '1.3.6.1.2.1.43.11.1.1.2',
      supplyIndex: '1.3.6.1.2.1.43.11.1.1.1',
    },
  },

  vendor: {
    hp: {
      deviceInfo: '1.3.6.1.4.1.11.2.3.9.1.1.2.1.1',
      totalBW: '1.3.6.1.4.1.11.2.3.9.1.1.2.1.1.1',
      totalColor: '1.3.6.1.4.1.11.2.3.9.1.1.2.1.1.2',
      serialNumber: '1.3.6.1.4.1.11.2.3.9.4.2.1.1.3.1',
    },
    brother: {
      serialNumber: '1.3.6.1.4.1.2435.2.3.9.1.1.1.1',
      totalBW: '1.3.6.1.4.1.2435.2.3.9.4.2.1.5.5.1',
      totalColor: '1.3.6.1.4.1.2435.2.3.9.4.2.1.5.5.2',
    },
    epson: {
      serialNumber: '1.3.6.1.4.1.1248.1.2.2.1.1',
      totalPages: '1.3.6.1.4.1.1248.1.2.2.51.1.1.1.1',
    },
    canon: {
      serialNumber: '1.3.6.1.4.1.1602.1.2.1.1.1',
      totalBW: '1.3.6.1.4.1.1602.1.3.1.1.5.1.1',
      totalColor: '1.3.6.1.4.1.1602.1.3.1.1.5.1.2',
    },
    ricoh: {
      serialNumber: '1.3.6.1.4.1.367.3.2.1.2.1.4',
      totalBW: '1.3.6.1.4.1.367.3.2.1.3.1.5.1.1',
      totalColor: '1.3.6.1.4.1.367.3.2.1.3.1.5.1.2',
    },
    xerox: {
      serialNumber: '1.3.6.1.4.1.253.8.53.1.1.1',
      totalPages: '1.3.6.1.4.1.253.8.53.1.3.1',
    },
    lexmark: {
      serialNumber: '1.3.6.1.4.1.641.1.1.1.1',
      totalPages: '1.3.6.1.4.1.641.1.1.1.3',
    },
    kyocera: {
      serialNumber: '1.3.6.1.4.1.1347.2.1.1.1',
      totalBW: '1.3.6.1.4.1.1347.2.2.1.1.1.1',
      totalColor: '1.3.6.1.4.1.1347.2.2.1.1.1.2',
    },
    sharp: {
      serialNumber: '1.3.6.1.4.1.2385.1.1.1.1',
      totalPages: '1.3.6.1.4.1.2385.1.3.1',
    },
    toshiba: {
      serialNumber: '1.3.6.1.4.1.6.1.1',
      totalPages: '1.3.6.1.4.1.6.3.1',
    },
    panasonic: {
      serialNumber: '1.3.6.1.4.1.248.1.1.1.1',
      totalPages: '1.3.6.1.4.1.248.1.3.1',
    },
    oki: {
      serialNumber: '1.3.6.1.4.1.222.1.1.1.1',
      totalPages: '1.3.6.1.4.1.222.1.3.1',
    },
    konicaMinolta: {
      serialNumber: '1.3.6.1.4.1.18334.1.1.1.1',
      totalBW: '1.3.6.1.4.1.18334.1.3.1.1.1.1',
      totalColor: '1.3.6.1.4.1.18334.1.3.1.1.1.2',
    },
  },
};

const SUPPLY_TYPES = {
  1: 'Other',
  2: 'Unknown',
  3: 'Toner',
  4: 'WasteToner',
  5: 'Ink',
  6: 'InkCartridge',
  7: 'InkRibbon',
  8: 'WasteInk',
  9: 'Fuser',
  10: 'CoronaWire',
  11: 'Drum',
  12: 'Developer',
  13: 'CleaningPad',
  14: 'Oil',
  15: 'TransferRoller',
  16: 'Belt',
};

const COLORANT_ROLES = {
  1: 'Process',
  2: 'Spot',
  3: 'SpotAndProcess',
};

const MARKER_TECHNOLOGIES = {
  1: 'Other',
  2: 'Electrophotographic',
  3: 'InkJet',
  4: 'Laser',
  5: 'Thermal',
  6: 'Impact',
  7: 'IonDeposition',
  8: 'Magnetographic',
  9: 'Photographic',
};

module.exports = { SNMP_OIDS, SUPPLY_TYPES, COLORANT_ROLES, MARKER_TECHNOLOGIES };
