import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, Smartphone,
  ToggleLeft, ToggleRight, ChevronDown, Download, Upload, Loader2,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function AdminDevices() {
  const navigate = useNavigate();
  const { devices, updateDevice, deleteDevice, addDevice, loadingDevices, loadMoreDevices, devicesHasMore } = useAdmin();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return devices.filter(d => {
      if (brandFilter && d.brand !== brandFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.fullName.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [devices, search, brandFilter]);

  const brands = [...new Set(devices.map(d => d.brand))].sort();

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreDevices,
    hasMore: devicesHasMore,
    loading: loadingDevices,
    threshold: 200,
  });

  const handleExport = () => {
    const storageSet = new Set<string>();
    devices.forEach(device => { device.defaultPricing?.forEach(pricing => { storageSet.add(pricing.storage); }); });
    const storages = Array.from(storageSet).sort();
    const conditions = [
      { name: 'New / Mint', key: 'gradeNew' },
      { name: 'Good', key: 'gradeGood' },
      { name: 'Broken / Faulty', key: 'gradeBroken' }
    ];
    const baseHeaders = ['Brand', 'Model Name', 'Category', 'Image URL', 'Is Active', 'Network'];
    const pricingHeaders: string[] = [];
    storages.forEach(storage => { conditions.forEach(condition => { pricingHeaders.push(`${storage} - ${condition.name}`); }); });
    const headers = [...baseHeaders, ...pricingHeaders];
    const rows: string[][] = [];
    devices.forEach(device => {
      const networkMap = new Map<string, typeof device.defaultPricing>();
      device.defaultPricing?.forEach(pricing => {
        if (!networkMap.has(pricing.network)) networkMap.set(pricing.network, []);
        networkMap.get(pricing.network)!.push(pricing);
      });
      if (networkMap.size === 0) {
        const baseRow = [device.brand, device.name, device.category, device.imageUrl || '', device.isActive ? 'true' : 'false', ''];
        rows.push([...baseRow, ...pricingHeaders.map(() => '')]);
      } else {
        networkMap.forEach((pricingList, network) => {
          const baseRow = [device.brand, device.name, device.category, device.imageUrl || '', device.isActive ? 'true' : 'false', network];
          const pricingRow: string[] = [];
          storages.forEach(storage => {
            conditions.forEach(condition => {
              const entry = (pricingList ?? []).find(p => p.storage === storage);
              const value = entry ? entry[condition.key as keyof typeof entry] || '' : '';
              pricingRow.push(String(value));
            });
          });
          rows.push([...baseRow, ...pricingRow]);
        });
      }
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `devices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/\r/g, '');
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV file is empty or has no data rows');
        const headerLine = lines[0];
        const headerRegex = /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g;
        const headers: string[] = [];
        let headerMatch;
        while ((headerMatch = headerRegex.exec(headerLine)) !== null) {
          if (headerMatch[1] !== undefined) {
            let value = headerMatch[1];
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/""/g, '"');
            headers.push(value.trim());
          }
        }
        const brandIdx = headers.findIndex(h => h.toLowerCase() === 'brand');
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes('model name'));
        const categoryIdx = headers.findIndex(h => h.toLowerCase() === 'category');
        const imageUrlIdx = headers.findIndex(h => h.toLowerCase().includes('image url'));
        const isActiveIdx = headers.findIndex(h => h.toLowerCase().includes('is active'));
        const networkIdx = headers.findIndex(h => h.toLowerCase() === 'network');
        if (brandIdx === -1 || nameIdx === -1 || categoryIdx === -1) throw new Error('CSV must have Brand, Model Name, and Category columns');
        const pricingColumns: Array<{ index: number; storage: string; field: string }> = [];
        headers.forEach((header, idx) => {
          const match = header.match(/^(.+?)\s*-\s*(.+)$/);
          if (match) {
            const part1 = match[1].trim();
            const part2 = match[2].trim();
            if (/\d+\s*(GB|TB)/i.test(part1)) {
              let field = '';
              if (part2.toLowerCase().includes('new') || part2.toLowerCase().includes('mint')) field = 'gradeNew';
              else if (part2.toLowerCase().includes('good')) field = 'gradeGood';
              else if (part2.toLowerCase().includes('broken') || part2.toLowerCase().includes('faulty')) field = 'gradeBroken';
              if (field) pricingColumns.push({ index: idx, storage: part1, field });
            }
          }
        });
        const parseLine = (line: string): string[] => {
          const regex = /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g;
          const vals: string[] = [];
          let m;
          while ((m = regex.exec(line)) !== null) {
            if (m[1] !== undefined) {
              let v = m[1];
              if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
              vals.push(v);
            }
          }
          return vals;
        };
        const deviceMap = new Map<string, { brand: string; name: string; category: string; imageUrl: string; isActive: boolean; pricingMap: Map<string, { network: string; storage: string; gradeNew: number; gradeGood: number; gradeBroken: number }> }>();
        lines.slice(1).forEach(line => {
          const values = parseLine(line);
          if (values.length <= Math.max(brandIdx, nameIdx, categoryIdx)) return;
          const brand = values[brandIdx] || 'Unknown';
          const name = values[nameIdx] || 'Unnamed Device';
          const category = values[categoryIdx] || 'Uncategorized';
          const imageUrl = imageUrlIdx >= 0 ? values[imageUrlIdx] || '' : '';
          const isActiveStr = isActiveIdx >= 0 ? values[isActiveIdx] : 'true';
          const network = networkIdx >= 0 ? (values[networkIdx] || 'Unlocked') : 'Unlocked';
          const deviceKey = `${brand}|${name}`;
          if (!deviceMap.has(deviceKey)) {
            deviceMap.set(deviceKey, { brand, name, category, imageUrl, isActive: isActiveStr.toLowerCase() === 'true', pricingMap: new Map() });
          }
          const deviceEntry = deviceMap.get(deviceKey)!;
          pricingColumns.forEach(({ index, storage, field }) => {
            const val = values[index];
            if (val && val.trim()) {
              const price = parseFloat(val);
              if (!isNaN(price) && price > 0) {
                const key = `${network}|${storage}`;
                if (!deviceEntry.pricingMap.has(key)) deviceEntry.pricingMap.set(key, { network, storage, gradeNew: 0, gradeGood: 0, gradeBroken: 0 });
                (deviceEntry.pricingMap.get(key) as any)[field] = price;
              }
            }
          });
        });
        let imported = 0;
        deviceMap.forEach(({ brand, name, category, imageUrl, isActive, pricingMap: pm }) => {
          const defaultPricing = Array.from(pm.values()).filter(p => p.gradeNew > 0 || p.gradeGood > 0 || p.gradeBroken > 0);
          addDevice({ brand, name, fullName: `${brand} ${name}`, category, imageUrl: imageUrl || undefined, isActive, defaultPricing: defaultPricing.length > 0 ? defaultPricing : undefined });
          imported++;
        });
        setImportSuccess(imported);
        setTimeout(() => setImportSuccess(null), 5000);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to import CSV');
        setTimeout(() => setImportError(null), 5000);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => { setImportError('Failed to read file'); setImporting(false); };
    reader.readAsText(file);
  };

  return (
    <AdminLayout title="Devices" subtitle="Manage device catalogue for pricing and orders">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices..." className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 w-48" />
          </div>
          <div className="relative">
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500">
              <option value="">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
          <span className="text-sm text-gray-600">{filtered.length} devices</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload className="w-4 h-4" /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
          <button onClick={() => navigate('/admin-cashmymobile/devices/new')} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      {importSuccess !== null && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-xs">✓</span></div>
          <div><p className="text-sm font-semibold text-green-900">Import Successful!</p><p className="text-xs text-green-700 mt-1">Successfully imported {importSuccess} device{importSuccess !== 1 ? 's' : ''}</p></div>
        </div>
      )}
      {importError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-xs">✕</span></div>
          <div><p className="text-sm font-semibold text-red-900">Import Failed</p><p className="text-xs text-red-700 mt-1">{importError}</p></div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <BrandTab active={!brandFilter} label="All" count={devices.length} onClick={() => setBrandFilter('')} />
        {brands.map(b => (
          <BrandTab key={b} active={brandFilter === b} label={b} count={devices.filter(d => d.brand === b).length} onClick={() => setBrandFilter(b)} />
        ))}
      </div>

      {loadingDevices && devices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Loader2 className="w-10 h-10 mx-auto text-red-500 animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading devices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No devices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(device => (
            <div key={device.id} className={`bg-white rounded-2xl border ${device.isActive ? 'border-gray-200' : 'border-gray-300 opacity-50'} overflow-hidden hover:shadow-lg hover:border-red-300 transition-all duration-300 group relative`}>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center h-48 relative overflow-hidden">
                <img
                  src={device.imageUrl || "https://zennara-storage.s3.ap-south-1.amazonaws.com/device-images/1771189550215-default%20(1).png"}
                  alt={device.name}
                  className="h-full w-auto object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = "https://zennara-storage.s3.ap-south-1.amazonaws.com/device-images/1771189550215-default%20(1).png"; }}
                />
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${device.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <p className="font-bold text-gray-900 text-base leading-tight mb-1">{device.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">{device.brand}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{device.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => updateDevice(device.id, { isActive: !device.isActive })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${device.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {device.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {device.isActive ? 'Active' : 'Activate'}
                  </button>
                  <button onClick={() => navigate(`/admin-cashmymobile/devices/edit/${device.id}`)} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(device.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingDevices && devices.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Device?</h3>
            <p className="text-sm text-gray-600 text-center mb-5">This will remove the device from the catalogue.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { deleteDevice(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function BrandTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${active ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
      {label} <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
    </button>
  );
}
