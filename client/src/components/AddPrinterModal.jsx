import { useState } from 'react';
import api from '../api';

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const BRANDS = [
  'HP', 'Epson', 'Canon', 'Brother', 'Ricoh', 'Xerox', 'Lexmark',
  'Kyocera', 'Sharp', 'Toshiba', 'Panasonic', 'OKI', 'Konica Minolta',
];

export default function AddPrinterModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    serial_number: '', ip_address: '', brand: '', model: '',
    hostname: '', location: '',
    total_pages: '', bw_pages: '', color_pages: '',
    toner_black: '', toner_cyan: '', toner_magenta: '', toner_yellow: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serial_number.trim() || !form.ip_address.trim()) {
      setError('Seri numarası ve IP adresi zorunludur');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        serial_number: form.serial_number.trim(),
        ip_address: form.ip_address.trim(),
        brand: form.brand || null,
        model: form.model || null,
        hostname: form.hostname || null,
        location: form.location || null,
        total_pages: parseInt(form.total_pages) || 0,
        bw_pages: parseInt(form.bw_pages) || 0,
        color_pages: parseInt(form.color_pages) || 0,
        toner_black: form.toner_black !== '' ? parseInt(form.toner_black) : null,
        toner_cyan: form.toner_cyan !== '' ? parseInt(form.toner_cyan) : null,
        toner_magenta: form.toner_magenta !== '' ? parseInt(form.toner_magenta) : null,
        toner_yellow: form.toner_yellow !== '' ? parseInt(form.toner_yellow) : null,
      };
      await api.addPrinter(payload);
      onSuccess();
      onClose();
      setForm({
        serial_number: '', ip_address: '', brand: '', model: '',
        hostname: '', location: '',
        total_pages: '', bw_pages: '', color_pages: '',
        toner_black: '', toner_cyan: '', toner_magenta: '', toner_yellow: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Yazıcı Ekle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><CloseIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seri No *</label>
              <input name="serial_number" value={form.serial_number} onChange={handleChange}
                className="input-field" placeholder="SN-12345" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">IP Adresi *</label>
              <input name="ip_address" value={form.ip_address} onChange={handleChange}
                className="input-field" placeholder="192.168.1.100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Marka</label>
              <select name="brand" value={form.brand} onChange={handleChange} className="input-field">
                <option value="">Seçiniz</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
              <input name="model" value={form.model} onChange={handleChange}
                className="input-field" placeholder="LaserJet Pro M404" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hostname</label>
              <input name="hostname" value={form.hostname} onChange={handleChange}
                className="input-field" placeholder="HP-LaserJet" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Konum</label>
              <input name="location" value={form.location} onChange={handleChange}
                className="input-field" placeholder="1. Kat - Ofis" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sayaç Bilgileri</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Toplam</label>
                <input name="total_pages" value={form.total_pages} onChange={handleChange}
                  className="input-field" type="number" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">S/B</label>
                <input name="bw_pages" value={form.bw_pages} onChange={handleChange}
                  className="input-field" type="number" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Renkli</label>
                <input name="color_pages" value={form.color_pages} onChange={handleChange}
                  className="input-field" type="number" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Toner Seviyeleri (%)</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'toner_black', label: 'Siyah' },
                { name: 'toner_cyan', label: 'Cyan' },
                { name: 'toner_magenta', label: 'Magenta' },
                  { name: 'toner_yellow', label: 'Sari' },
              ].map(t => (
                <div key={t.name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.label}</label>
                  <input name={t.name} value={form[t.name]} onChange={handleChange}
                    className="input-field" type="number" min="0" max="100" placeholder="—" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Iptal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Kaydediliyor...' : 'Yaziciyi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
