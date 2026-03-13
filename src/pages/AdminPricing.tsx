import { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronDown, ChevronUp, Save, Download,
  BarChart2, CheckCircle, DollarSign, Loader2,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import type { PricingEntry, UtilityItem } from '../types';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

type PriceGrid = Record<string, Record<string, string>>;

const gradeFieldsByIndex: ('gradeNew' | 'gradeGood' | 'gradeBroken')[] = ['gradeNew', 'gradeGood', 'gradeBroken'];

function getCondColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('new') || n.includes('mint')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (n.includes('good')) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function DeviceCard({
  device, entries, networks, storageOptions, conditions, onSave,
}: {
  device: { id: string; fullName: string; brand: string; category: string; imageUrl?: string };
  entries: PricingEntry[];
  networks: UtilityItem[];
  storageOptions: UtilityItem[];
  conditions: UtilityItem[];
  onSave: (deviceId: string, networks: string[], grid: PriceGrid) => Promise<void>;
}) {
  const activeNetworks = networks.filter(n => n.isActive);
  const activeStorages = storageOptions.filter(s => s.isActive);
  const activeConditions = conditions.filter(c => c.isActive);

  const [expanded, setExpanded] = useState(false);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(activeNetworks.length > 0 ? [activeNetworks[0].name] : []);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewNetwork = selectedNetworks[0] || '';

  const buildGrid = (network: string): PriceGrid => {
    const grid: PriceGrid = {};
    for (const s of activeStorages) {
      grid[s.name] = {};
      for (let i = 0; i < activeConditions.length; i++) {
        const c = activeConditions[i];
        const entry = entries.find(e => e.network === network && e.storage === s.name);
        const field = gradeFieldsByIndex[i];
        grid[s.name][c.name] = entry && field ? String(entry[field] ?? '') : '';
      }
    }
    return grid;
  };

  const [grid, setGrid] = useState<PriceGrid>(() => buildGrid(previewNetwork));

  useEffect(() => {
    const newGrid: PriceGrid = {};
    for (const s of activeStorages) {
      newGrid[s.name] = {};
      for (let i = 0; i < activeConditions.length; i++) {
        const c = activeConditions[i];
        const entry = entries.find(e => e.network === previewNetwork && e.storage === s.name);
        const field = gradeFieldsByIndex[i];
        newGrid[s.name][c.name] = entry && field ? String(entry[field] ?? '') : '';
      }
    }
    setGrid(newGrid);
    setDirty(false);
    setSaved(false);
  }, [entries, previewNetwork]);

  const toggleNetwork = (name: string) => {
    setSelectedNetworks(prev => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        const next = prev.filter(n => n !== name);
        setGrid(buildGrid(next[0]));
        return next;
      }
      return [...prev, name];
    });
    setDirty(false);
    setSaved(false);
  };

  const selectAll = () => { setSelectedNetworks(activeNetworks.map(n => n.name)); setDirty(false); setSaved(false); };

  const setPrice = (storage: string, condition: string, val: string) => {
    setGrid(prev => ({ ...prev, [storage]: { ...prev[storage], [condition]: val } }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await onSave(device.id, selectedNetworks, grid);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save pricing:', error);
    }
  };

  const configuredCount = entries.filter(e => e.deviceId === device.id).length;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm ${expanded ? 'border-red-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {device.imageUrl
            ? <img src={device.imageUrl} alt={device.fullName} className="w-8 h-8 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <DollarSign className="w-5 h-5 text-gray-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base truncate">{device.fullName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600">{device.brand}</span>
            {configuredCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                {configuredCount} {configuredCount === 1 ? 'entry' : 'entries'} configured
              </span>
            )}
          </div>
        </div>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${expanded ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:text-gray-900'}`}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
        >
          Configure Pricing
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 px-5 py-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">Set Pricing by Condition &amp; Storage</h3>
            <p className="text-xs text-gray-600 mt-0.5">Select one or more networks — prices apply to all selected networks</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Network</span>
              <button onClick={selectAll} className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">Select All</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeNetworks.map(n => {
                const isSelected = selectedNetworks.includes(n.name);
                return (
                  <button key={n.id} onClick={() => toggleNetwork(n.name)} className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${isSelected ? 'bg-red-600 border-red-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'}`}>
                    {isSelected && <span className="mr-1 opacity-80">✓</span>}
                    {n.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 mb-5" />

          {activeStorages.length === 0 || activeConditions.length === 0 ? (
            <p className="text-sm text-gray-600 py-4 text-center">No active storage options or conditions. Configure them in <span className="text-red-500">Utilities</span>.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 8px' }}>
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Condition</th>
                    {activeStorages.map(s => (
                      <th key={s.id} className="pb-3 px-2 text-center min-w-[150px]">
                        <span className="inline-block px-4 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 uppercase tracking-wider">{s.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeConditions.map(cond => (
                    <tr key={cond.id}>
                      <td className="py-2 pr-6 align-middle">
                        <span className={`inline-flex items-center px-3.5 py-2 rounded-full text-xs font-semibold border whitespace-nowrap ${getCondColor(cond.name)}`}>{cond.name}</span>
                      </td>
                      {activeStorages.map(stor => (
                        <td key={stor.id} className="py-2 px-2 align-middle">
                          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden transition-all duration-150 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 hover:border-gray-400 bg-white">
                            <span className="pl-3 pr-1.5 text-xs font-bold text-gray-600 select-none flex-shrink-0">£</span>
                            <input
                              type="number" min={0} step="0.01" placeholder="0"
                              value={grid[stor.name]?.[cond.name] ?? ''}
                              onChange={e => setPrice(stor.name, cond.name, e.target.value)}
                              className="w-full py-2.5 pr-3 text-gray-900 text-sm font-semibold placeholder-gray-400 focus:outline-none bg-white"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {dirty && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              {saved && !dirty && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved to {selectedNetworks.length} network{selectedNetworks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${dirty ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}
            >
              <Save className="w-4 h-4" /> Save This Device
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPricing() {
  const { devices, pricingEntries, updateDevice, loadingPricing, loadMorePricing, pricingHasMore, addPricingEntry, updatePricingEntry, networks, storageOptions, conditions } = useAdmin();

  const sentinelRef = useInfiniteScroll({ onLoadMore: loadMorePricing, hasMore: pricingHasMore, loading: loadingPricing, threshold: 200 });

  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  const activeDevices = useMemo(() => devices.filter(d => d.isActive), [devices]);
  const brands = useMemo(() => [...new Set(activeDevices.map(d => d.brand))].sort(), [activeDevices]);

  const filteredDevices = useMemo(() => {
    return activeDevices.filter(d => {
      if (filterBrand && d.brand !== filterBrand) return false;
      if (search) { const q = search.toLowerCase(); return d.fullName.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q); }
      return true;
    });
  }, [activeDevices, search, filterBrand]);

  const handleSaveDevice = async (deviceId: string, selectedNetworksList: string[], grid: PriceGrid) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    const activeStorages = storageOptions.filter(s => s.isActive);
    const activeConditions = conditions.filter(c => c.isActive);
    const getField = (_condName: string, index: number): 'gradeNew' | 'gradeGood' | 'gradeBroken' => {
      return gradeFieldsByIndex[index] ?? 'gradeNew';
    };
    try {
      for (const network of selectedNetworksList) {
        for (const stor of activeStorages) {
          const existingEntry = pricingEntries.find(e => e.deviceId === deviceId && e.network === network && e.storage === stor.name);
          const updates: Partial<PricingEntry> = {};
          activeConditions.forEach((cond, idx) => {
            const field = getField(cond.name, idx);
            const raw = grid[stor.name]?.[cond.name] ?? '';
            (updates as any)[field] = raw === '' ? 0 : parseFloat(raw) || 0;
          });
          if (existingEntry) {
            await updatePricingEntry(existingEntry.id, updates);
          } else {
            const hasPrice = Object.values(updates).some(v => (v as number) > 0);
            if (hasPrice) {
              await addPricingEntry({
                deviceId, deviceName: device.fullName, network, storage: stor.name,
                gradeNew: (updates.gradeNew as number) ?? 0,
                gradeGood: (updates.gradeGood as number) ?? 0,
                gradeBroken: (updates.gradeBroken as number) ?? 0,
                deeplink: '',
              });
            }
          }
        }
      }
      const defaultPricing: Array<{ network: string; storage: string; gradeNew: number; gradeGood: number; gradeBroken: number }> = [];
      for (const network of selectedNetworksList) {
        for (const stor of activeStorages) {
          const u = { gradeNew: 0, gradeGood: 0, gradeBroken: 0 };
          activeConditions.forEach((cond, idx) => {
            const field = getField(cond.name, idx);
            const raw = grid[stor.name]?.[cond.name] ?? '';
            (u as any)[field] = raw === '' ? 0 : parseFloat(raw) || 0;
          });
          if (u.gradeNew > 0 || u.gradeGood > 0 || u.gradeBroken > 0) defaultPricing.push({ network, storage: stor.name, ...u });
        }
      }
      await updateDevice(deviceId, { defaultPricing }, { skipPricingSync: true });
    } catch (error) {
      console.error('Error saving device pricing:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Device', 'Network', 'Storage', 'Grade NEW (£)', 'Grade GOOD (£)', 'Grade BROKEN (£)', 'Updated'];
    const rows = pricingEntries.map(p => [p.deviceName, p.network, p.storage, p.gradeNew, p.gradeGood, p.gradeBroken, p.updatedAt]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pricing-feed.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Pricing Feed" subtitle="Configure device prices by network, storage & condition">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by brand or model..." className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 w-56" />
          </div>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="text-sm text-gray-600">{filteredDevices.length} devices</span>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all">
          <Download className="w-4 h-4" /> Export Feed
        </button>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
          <BarChart2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No devices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              entries={pricingEntries.filter(e => e.deviceId === device.id)}
              networks={networks}
              storageOptions={storageOptions}
              conditions={conditions}
              onSave={handleSaveDevice}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-20 flex items-center justify-center mt-6">
        {loadingPricing && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading more pricing...</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
