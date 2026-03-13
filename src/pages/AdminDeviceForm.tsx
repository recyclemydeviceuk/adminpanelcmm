import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image as ImageIcon, Save, AlertCircle, ChevronDown } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import type { Device } from '../types';
import { uploadApi } from '../api/upload';
import { deviceApi } from '../api/devices';
import { pricingApi } from '../api/pricing';

const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all";

type PriceGrid = Record<string, Record<string, Record<string, string>>>;

export default function AdminDeviceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, addDevice, updateDevice, storageOptions, conditions, networks, brands, categories, pricingEntries } = useAdmin();

  const [device, setDevice] = useState<Device | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(!!id);
  const isEditing = !!id;

  const activeStorages = storageOptions.filter(s => s.isActive);
  const activeConditions = conditions.filter(c => c.isActive);
  const activeNetworks = networks.filter(n => n.isActive);
  const activeBrands = brands.filter(b => b.isActive);
  const activeCategories = categories.filter(c => c.isActive);

  const [devicePricingDirect, setDevicePricingDirect] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchDevice = async () => {
      try {
        setLoadingDevice(true);
        const response = await deviceApi.getDeviceById(id);
        if (response.success && response.data?.device) {
          const d = response.data.device as any;
          setDevice({ id: d._id || d.id, brand: d.brand, name: d.name, fullName: d.fullName || d.full_name, category: d.category, imageUrl: d.imageUrl || d.image_url, isActive: d.isActive ?? d.is_active, createdAt: d.createdAt || d.created_at });
          // Use pricing returned directly by getDeviceById
          const devicePricing: any[] = response.data.pricing || [];
          if (devicePricing.length > 0) {
            setDevicePricingDirect(devicePricing);
          } else {
            // Fallback: fetch pricing directly
            const pRes = await pricingApi.getPricingByDevice(d._id || d.id);
            if (pRes.success) setDevicePricingDirect((pRes.data as any)?.pricing || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch device:', error);
      } finally {
        setLoadingDevice(false);
      }
    };
    fetchDevice();
  }, [id]);

  const [form, setForm] = useState({
    brand: activeBrands[0]?.name || 'Apple',
    name: '',
    fullName: '',
    category: activeCategories[0]?.name || 'iPhone',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (device) {
      setForm({ brand: device.brand, name: device.name, fullName: device.fullName, category: device.category, imageUrl: device.imageUrl || '', isActive: device.isActive });
      setImagePreview(device.imageUrl || '');
    }
  }, [device]);

  const [selectedStorages, setSelectedStorages] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricingGrid, setPricingGrid] = useState<PriceGrid>({});
  const conditionsRef = useRef(conditions);
  conditionsRef.current = conditions;

  useEffect(() => {
    if (!device?.id) return;
    // Use directly fetched pricing first, fall back to store
    const fromStore = pricingEntries.filter(p =>
      p.deviceId === device.id ||
      (p as any).device_id === device.id
    );
    const devicePricing = devicePricingDirect.length > 0
      ? devicePricingDirect.map((p: any) => ({
          deviceId: p.deviceId || p.device_id,
          network: p.network,
          storage: p.storage,
          gradeNew: p.gradeNew ?? p.grade_new ?? 0,
          gradeGood: p.gradeGood ?? p.grade_good ?? 0,
          gradeBroken: p.gradeBroken ?? p.grade_broken ?? 0,
        }))
      : fromStore;
    if (devicePricing.length === 0) return;
    const activeC = conditionsRef.current.filter(c => c.isActive);
    const storages = [...new Set(devicePricing.map(p => p.storage))];
    setSelectedStorages(storages);
    const nets = [...new Set(devicePricing.map(p => p.network))];
    setSelectedNetworks(nets);
    const gradeFields: ('gradeNew' | 'gradeGood' | 'gradeBroken')[] = ['gradeNew', 'gradeGood', 'gradeBroken'];
    const allConds = activeC;
    const usedConditions = new Set<string>();
    const grid: PriceGrid = {};
    devicePricing.forEach(entry => {
      if (!grid[entry.network]) grid[entry.network] = {};
      if (!grid[entry.network][entry.storage]) grid[entry.network][entry.storage] = {};
      allConds.forEach((cond, idx) => {
        const field = gradeFields[idx];
        if (field) {
          const val = entry[field] ?? 0;
          grid[entry.network][entry.storage][cond.name] = String(val || '');
          if (val > 0) usedConditions.add(cond.name);
        }
      });
    });
    setSelectedConditions(usedConditions.size > 0 ? Array.from(usedConditions) : allConds.map(c => c.name));
    setPricingGrid(grid);
  }, [device, pricingEntries]);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const response = await uploadApi.uploadImage(file);
      if (response.success && response.data?.imageUrl) {
        set('imageUrl', response.data.imageUrl);
        setImagePreview(response.data.imageUrl);
      }
    } catch (error) {
      setErrors(['Failed to upload image. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  const toggleItem = (type: 'network' | 'storage' | 'condition', name: string) => {
    const setter = type === 'network' ? setSelectedNetworks : type === 'storage' ? setSelectedStorages : setSelectedConditions;
    setter(prev => {
      const isRemoving = prev.includes(name);
      if (isRemoving) {
        setPricingGrid(gridPrev => {
          const updated = { ...gridPrev };
          if (type === 'network') { delete updated[name]; }
          else if (type === 'storage') { Object.keys(updated).forEach(net => { const g = { ...updated[net] }; delete g[name]; updated[net] = g; }); }
          else if (type === 'condition') { Object.keys(updated).forEach(net => { Object.keys(updated[net]).forEach(stor => { const g = { ...updated[net][stor] }; delete g[name]; updated[net][stor] = g; }); }); }
          return { ...updated };
        });
      }
      return isRemoving ? prev.filter(n => n !== name) : [...prev, name];
    });
  };

  const setPriceValue = (network: string, storage: string, condition: string, val: string) => {
    setPricingGrid(prev => {
      const updated = { ...prev };
      if (!updated[network]) updated[network] = {};
      if (!updated[network][storage]) updated[network][storage] = {};
      updated[network][storage][condition] = val;
      return updated;
    });
  };

  const handleSave = async () => {
    const errs: string[] = [];
    if (!form.brand.trim()) errs.push('Brand is required');
    if (!form.name.trim()) errs.push('Name is required');
    if (!form.category.trim()) errs.push('Category is required');
    if (errs.length > 0) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!form.fullName.trim()) form.fullName = `${form.brand} ${form.name}`;

    const activeC = conditionsRef.current.filter(c => c.isActive);
    const gradeFields: ('gradeNew' | 'gradeGood' | 'gradeBroken')[] = ['gradeNew', 'gradeGood', 'gradeBroken'];

    const defaultPricing: NonNullable<Device['defaultPricing']> = [];
    selectedNetworks.forEach(network => {
      selectedStorages.forEach(storage => {
        const condPrices = pricingGrid[network]?.[storage] || {};
        let gradeNew = 0, gradeGood = 0, gradeBroken = 0;
        activeC.forEach((cond, idx) => {
          if (!selectedConditions.includes(cond.name)) return;
          const val = parseFloat(condPrices[cond.name] || '0') || 0;
          if (idx === 0) gradeNew = val;
          else if (idx === 1) gradeGood = val;
          else if (idx === 2) gradeBroken = val;
        });
        if (gradeNew > 0 || gradeGood > 0 || gradeBroken > 0) {
          defaultPricing.push({ network, storage, gradeNew, gradeGood, gradeBroken });
        }
      });
    });

    const saveData = { ...form, imageUrl: form.imageUrl || imagePreview, defaultPricing: defaultPricing.length > 0 ? defaultPricing : undefined };
    try {
      setSaving(true);
      if (isEditing && device) { await updateDevice(device.id, saveData, { skipPricingSync: true }); }
      else { await addDevice(saveData); }
      navigate('/admin-cashmymobile/devices');
    } catch (error) {
      setErrors(['Failed to save device. Please try again.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingDevice) {
    return (
      <AdminLayout title="Loading..." subtitle="Fetching device details">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading device...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? `Edit Device: ${device?.name || ''}` : 'Add New Device'} subtitle={isEditing ? 'Update device details and pricing' : 'Add a new device to the catalog'}>
      <div className="max-w-7xl w-full">
        <button onClick={() => navigate('/admin-cashmymobile/devices')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Devices
        </button>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            {errors.map(e => (
              <div key={e} className="flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4" /> {e}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Device Photo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Device Photo</h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-4 flex items-center justify-center h-64 relative overflow-hidden border border-gray-200">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-full w-auto object-contain drop-shadow-lg" onError={e => { e.currentTarget.src = "https://zennara-storage.s3.ap-south-1.amazonaws.com/device-images/1771189550215-default%20(1).png"; }} />
                    <button onClick={() => { setImagePreview(''); set('imageUrl', ''); }} className="absolute top-3 right-3 p-1.5 bg-red-600 rounded-lg hover:bg-red-700 shadow-md transition-all">
                      <span className="text-white text-xs font-bold">✕</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No image uploaded</p>
                  </div>
                )}
              </div>
              <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-all mb-3 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : imagePreview ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Or enter image URL</label>
                <input value={form.imageUrl} onChange={e => { set('imageUrl', e.target.value); setImagePreview(e.target.value); }} className={inputCls} placeholder="https://example.com/image.jpg" />
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Basic Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Brand *</label>
                  <div className="relative">
                    <select value={form.brand} onChange={e => set('brand', e.target.value)} className={inputCls}>
                      {activeBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Category *</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                      {activeCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Model Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g., iPhone 16 Pro Max" />
                <p className="text-xs text-gray-500 mt-1">Full name: {form.brand} {form.name}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Device Specifications</h3>
              <p className="text-xs text-gray-500 mb-4">Select all applicable options for this device model</p>
              <div className="space-y-5">
                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Storage Options</label>
                    <button type="button" onClick={() => setSelectedStorages(activeStorages.map(s => s.name))} className="text-xs text-red-600 hover:text-red-700 font-semibold">Select All</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeStorages.map(s => {
                      const isSelected = selectedStorages.includes(s.name);
                      return (
                        <button key={s.id} type="button" onClick={() => toggleItem('storage', s.name)} className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                          {isSelected && <span className="mr-1">✓</span>}{s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Network */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Network Options</label>
                    <button type="button" onClick={() => setSelectedNetworks(activeNetworks.map(n => n.name))} className="text-xs text-red-600 hover:text-red-700 font-semibold">Select All</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeNetworks.map(n => {
                      const isSelected = selectedNetworks.includes(n.name);
                      return (
                        <button key={n.id} type="button" onClick={() => toggleItem('network', n.name)} className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                          {isSelected && <span className="mr-1">✓</span>}{n.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Conditions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Condition Options</label>
                    <button type="button" onClick={() => setSelectedConditions(activeConditions.map(c => c.name))} className="text-xs text-red-600 hover:text-red-700 font-semibold">Select All</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeConditions.map(c => {
                      const isSelected = selectedConditions.includes(c.name);
                      const isNew = c.name.toLowerCase().includes('new') || c.name.toLowerCase().includes('mint');
                      const isGood = c.name.toLowerCase().includes('good');
                      const colorClass = isNew ? isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-emerald-300' : isGood ? isSelected ? 'bg-green-600 border-green-600' : 'border-green-300' : isSelected ? 'bg-orange-600 border-orange-600' : 'border-orange-300';
                      return (
                        <button key={c.id} type="button" onClick={() => toggleItem('condition', c.name)} className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${isSelected ? `${colorClass} text-white shadow-md` : `bg-white ${colorClass} text-gray-700 hover:border-gray-400`}`}>
                          {isSelected && <span className="mr-1">✓</span>}{c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button type="button" onClick={() => setShowPricing(!showPricing)} className="flex items-center justify-between w-full text-left p-6 hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pricing Configuration</h3>
                  <p className="text-xs text-gray-500 mt-1">Set prices by network, storage &amp; condition</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showPricing ? 'rotate-180' : ''}`} />
              </button>
              {showPricing && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                  <div className="pt-4">
                    {selectedStorages.length === 0 || selectedNetworks.length === 0 || selectedConditions.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-amber-700 font-semibold">⚠️ Please select Storage, Network, and Condition options above first</p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-700 font-semibold">{selectedNetworks.length} network(s) × {selectedStorages.length} storage(s) × {selectedConditions.length} condition(s)</p>
                        <p className="text-xs text-blue-600 mt-1">{selectedNetworks.join(', ')} | {selectedStorages.join(', ')} | {selectedConditions.join(', ')}</p>
                      </div>
                    )}
                  </div>
                  {selectedNetworks.length > 0 && selectedStorages.length > 0 && selectedConditions.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 overflow-x-auto">
                      <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 8px' }}>
                        <thead>
                          <tr>
                            <th className="text-left pb-2 pr-4 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">Condition</th>
                            {selectedStorages.map(s => (
                              <th key={s} className="pb-2 px-2 text-center min-w-[120px]">
                                <span className="inline-block px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-900 shadow-sm">{s}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedConditions.map(cond => {
                            const isNew = cond.toLowerCase().includes('new') || cond.toLowerCase().includes('mint');
                            const isGood = cond.toLowerCase().includes('good');
                            const condColor = isNew ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : isGood ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-red-100 text-red-700 border-red-300';
                            return (
                              <tr key={cond}>
                                <td className="py-1 pr-4">
                                  <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${condColor} shadow-sm`}>{cond}</span>
                                </td>
                                {selectedStorages.map(stor => {
                                  const network = selectedNetworks[0];
                                  const value = pricingGrid[network]?.[stor]?.[cond] || '';
                                  return (
                                    <td key={stor} className="py-1 px-2">
                                      <div className={`flex items-center border-2 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 bg-white shadow-sm ${!value || parseFloat(value) === 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-300'}`}>
                                        <span className="pl-3 pr-1 text-sm font-bold text-gray-600 select-none">£</span>
                                        <input
                                          type="number" min={0} placeholder="0" value={value}
                                          onChange={e => { selectedNetworks.forEach(net => { setPriceValue(net, stor, cond, e.target.value); }); }}
                                          className="w-full py-2.5 pr-3 text-gray-900 text-sm font-semibold placeholder-gray-400 focus:outline-none bg-transparent"
                                        />
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status & Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Device Status</h3>
                  <p className="text-xs text-gray-500 mt-1">Make device available in catalog</p>
                </div>
                <button type="button" onClick={() => set('isActive', !form.isActive)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${form.isActive ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-gray-100 text-gray-600 border-2 border-gray-300'}`}>
                  {form.isActive ? '✓ Active' : 'Inactive'}
                </button>
              </div>
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button onClick={() => navigate('/admin-cashmymobile/devices')} className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving || uploading} className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Device'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
