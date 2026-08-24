import { useState, useEffect } from 'react';
import {
  Plus, RefreshCw, ToggleLeft, ToggleRight,
  Trash2, Key, Copy, Building2, Loader2,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';

export default function AdminPartners() {
  const { partners, loadingPartners, fetchPartners, createPartner, regeneratePartnerKey, togglePartner, deletePartner } = useAdmin();

  const [newName, setNewName] = useState('');
  const [newIsTest, setNewIsTest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ id: string; key: string; name: string; isTest?: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await createPartner(newName.trim(), newIsTest);
      // python_backend returns api_key inside data.partner.api_key
      const rawData = res.data as any;
      const apiKey = rawData?.partner?.api_key || rawData?.api_key || rawData?.apiKey;
      if (res.success && apiKey) {
        const partnerData = rawData?.partner;
        setNewKey({
          id: partnerData?._id || partnerData?.id || '',
          key: apiKey,
          name: newName.trim(),
          isTest: newIsTest,
        });
        setNewName('');
        setNewIsTest(false);
        setShowCreateForm(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create partner');
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerate = async (id: string, name: string) => {
    try {
      const res = await regeneratePartnerKey(id);
      // python_backend returns { success, data: { api_key: '...' } }
      const rawData = res.data as any;
      const apiKey = rawData?.api_key || rawData?.apiKey;
      if (res.success && apiKey) {
        setNewKey({ id, key: apiKey, name });
      }
    } catch (err) {
      console.error('Failed to regenerate key:', err);
    }
  };

  const copyKey = () => {
    if (newKey?.key) {
      navigator.clipboard.writeText(newKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <AdminLayout title="API Partners" subtitle="Manage partner API access and keys">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <span className="text-sm text-gray-600">{partners.length} partner{partners.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPartners()}
            disabled={loadingPartners}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all disabled:opacity-50"
          >
            {loadingPartners ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Partner
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Create New Partner</h3>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              placeholder="Partner name (e.g. DecisionTech)"
              className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => { setShowCreateForm(false); setNewName(''); setNewIsTest(false); setError(''); }} className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
              Cancel
            </button>
          </div>
          <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newIsTest}
              onChange={e => setNewIsTest(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">
              <span className="font-semibold">UAT / test partner</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Orders sent with this key are marked as test data: they are hidden from the
                orders list, dashboard and exports, never trigger a customer confirmation
                email, and do not count towards partner order totals. Use this for a
                partner's integration testing — never for live traffic.
              </span>
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-3">An API key will be generated automatically. Store it securely — it won't be shown again.</p>
        </div>
      )}

      {newKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">API Key for {newKey.name}</h3>
            {newKey.isTest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                UAT / Test
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-700 mb-3">Save this key now — it won't be shown again after you close this notice.</p>
          <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-xl px-4 py-3">
            <code className="flex-1 text-sm font-mono text-gray-900 break-all">{newKey.key}</code>
            <button onClick={copyKey} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${copiedKey ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {copiedKey ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-3 text-xs text-emerald-600 hover:text-emerald-800 font-semibold">
            I've saved the key, dismiss this
          </button>
        </div>
      )}

      {loadingPartners && partners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Loader2 className="w-10 h-10 mx-auto text-red-500 animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No partners yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a partner to generate API access keys</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Partner', 'Key Prefix', 'Status', 'Total Orders', 'Last Used', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map(partner => (
                <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {partner.name}
                          {partner.isTest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">
                              Test
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">ID: {partner.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{partner.keyPrefix}...</code>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${partner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {partner.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-medium">{partner.totalOrders.toLocaleString()}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {partner.lastUsedAt ? new Date(partner.lastUsedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(partner.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePartner(partner.id)}
                        className={`p-1.5 rounded-lg transition-all ${partner.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={partner.isActive ? 'Disable' : 'Enable'}
                      >
                        {partner.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleRegenerate(partner.id, partner.name)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Regenerate API Key"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(partner.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete Partner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete Partner?</h3>
            <p className="text-sm text-gray-600 text-center mb-5">This will revoke their API access permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { deletePartner(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
