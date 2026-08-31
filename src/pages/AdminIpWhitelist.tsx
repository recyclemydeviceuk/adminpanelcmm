import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Trash2, RefreshCw, Loader2, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle2, Info, Radar,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { ipWhitelistApi, IpWhitelistEntry, GatewayTestResult } from '../api/ipWhitelist';

export default function AdminIpWhitelist() {
  const [entries, setEntries] = useState<IpWhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<GatewayTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ipWhitelistApi.getAll();
      if (res.success && res.data?.entries) setEntries(res.data.entries);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load the IP whitelist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async () => {
    if (!newIp.trim()) return;
    setAdding(true);
    setError('');
    try {
      await ipWhitelistApi.add(newIp.trim(), newLabel.trim() || undefined);
      setNewIp(''); setNewLabel(''); setShowAddForm(false);
      await fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add that IP or range');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    try { await ipWhitelistApi.toggle(id); await fetchEntries(); }
    catch { setError('Failed to change that entry'); }
  };

  const handleDelete = async (id: string) => {
    try { await ipWhitelistApi.remove(id); setConfirmDelete(null); await fetchEntries(); }
    catch { setError('Failed to remove that entry'); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await ipWhitelistApi.test();
      setTestResult((res.data ?? res) as GatewayTestResult);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Connectivity check failed');
    } finally {
      setTesting(false);
    }
  };

  const activeCount = entries.filter(e => e.isActive).length;

  return (
    <AdminLayout
      title="IP Whitelist"
      subtitle="Partner source IPs and ranges we recognise"
    >
      {/* The single most important thing on this page: these entries do not
          block anyone. Stating it up front stops it being mistaken for a
          firewall by whoever reads this screen next. */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 mb-5">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-0.5">These entries are recorded, not enforced.</p>
          <p className="text-blue-800 text-[13px] leading-relaxed">
            The partner API gateway accepts requests from <em>any</em> IP address — what
            authorises a partner is their API key. This list is used to label incoming
            traffic on the API Gateway page, so you can confirm a partner is reaching us
            from the addresses they told you about. Adding or removing an entry here will
            never block or unblock anyone.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <span className="text-sm text-gray-600">
          {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          {entries.length > 0 && <span className="text-gray-400"> · {activeCount} active</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Check my IP
          </button>
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add IP / Range
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {testResult && (
        <div className={`rounded-2xl border p-5 mb-5 ${
          testResult.ip_whitelisted
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.ip_whitelisted
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              : <AlertCircle className="w-5 h-5 text-amber-600" />}
            <h3 className={`font-semibold ${testResult.ip_whitelisted ? 'text-emerald-800' : 'text-amber-800'}`}>
              We see you arriving from {testResult.source_ip}
            </h3>
          </div>
          <p className={`text-sm ${testResult.ip_whitelisted ? 'text-emerald-700' : 'text-amber-700'}`}>
            {testResult.ip_whitelisted === null
              ? 'Whitelist status could not be determined — the lookup failed. Your request was still accepted.'
              : testResult.ip_whitelisted
                ? 'That address matches an active entry below.'
                : 'That address is not in the list below. Your request was still accepted — nothing is blocked.'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This is the same check a partner can run themselves:
            {' '}<code className="font-mono bg-white/70 px-1.5 py-0.5 rounded">GET /api/gateway/test</code>
          </p>
          <button onClick={() => setTestResult(null)} className="mt-3 text-xs font-semibold text-gray-600 hover:text-gray-900">
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Add an IP address or range</h3>
          <div className="flex flex-wrap gap-3">
            <input
              value={newIp}
              onChange={e => { setNewIp(e.target.value); setError(''); }}
              placeholder="91.102.184.0/24"
              className="flex-1 min-w-[200px] px-3 py-2.5 text-sm font-mono border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (e.g. MONY Group primary)"
              className="flex-1 min-w-[200px] px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newIp.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewIp(''); setNewLabel(''); setError(''); }}
              className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Accepts a single address (<code className="font-mono">91.102.184.10</code>) or a
            CIDR range (<code className="font-mono">91.102.184.0/24</code>, which covers 256 addresses).
          </p>
        </div>
      )}

      {loading && entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Loader2 className="w-10 h-10 mx-auto text-red-500 animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading whitelist...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center shadow-sm">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No IPs recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">Known partner ranges are seeded automatically when the API starts</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['IP / Range', 'Label', 'Status', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <code className="font-mono font-semibold text-gray-900">{entry.ip_address}</code>
                        {entry.ip_address.includes('/') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                            Range
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{entry.label || <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {entry.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(entry.id)}
                          className={`p-1.5 rounded-lg transition-all ${entry.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={entry.isActive ? 'Mark inactive' : 'Mark active'}
                        >
                          {entry.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Remove"
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
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Remove this entry?</h3>
            <p className="text-sm text-gray-600 text-center mb-5">
              Traffic from this address will stop being labelled as recognised. Nothing will
              be blocked either way. Known partner ranges are re-seeded when the API restarts.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
