import { useState } from 'react';
import {
  Globe, CheckCircle2, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Loader2, Play, Trash2,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import { apiGatewayApi } from '../api/apiGateway';

export default function AdminApiGateway() {
  const { apiLogs, processApiOrder, fetchApiLogs, loadingApiLogs } = useAdmin();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '07700900000',
    customer_address: '1 Test Street, London, SW1A 1AA',
    device_name: 'iPhone 15 Pro',
    network: 'Unlocked',
    device_grade: 'GOOD',
    storage: '256GB',
    offered_price: 350,
    postage_method: 'label',
    payout_account_name: 'Test Customer',
    payout_sort_code: '00-00-00',
    payout_account_number: '12345678',
  }, null, 2));
  const [partnerKey, setPartnerKey] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  const handleTestOrder = async () => {
    if (!partnerKey.trim()) {
      setTestResult({ success: false, error: 'Partner API key is required' });
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const payload = JSON.parse(testPayload);
      const result = await processApiOrder(payload, partnerKey.trim());
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Invalid JSON or request failed' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleaningUp(true);
    try {
      await apiGatewayApi.cleanupOldLogs(90);
      await fetchApiLogs();
    } catch (err) {
      console.error('Cleanup failed:', err);
    } finally {
      setCleaningUp(false);
      setConfirmCleanup(false);
    }
  };

  const successCount = apiLogs.filter(l => l.success).length;
  const errorCount = apiLogs.filter(l => !l.success).length;
  const avgResponse = apiLogs.length > 0
    ? Math.round(apiLogs.reduce((s, l) => s + l.responseTime, 0) / apiLogs.length)
    : 0;

  return (
    <AdminLayout title="API Gateway" subtitle="Monitor API requests and test the order endpoint">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Requests" value={apiLogs.length} icon={<Globe className="w-5 h-5 text-blue-500" />} bg="bg-blue-50" />
        <StatCard label="Successful" value={successCount} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} bg="bg-emerald-50" />
        <StatCard label="Failed" value={errorCount} icon={<XCircle className="w-5 h-5 text-red-500" />} bg="bg-red-50" />
        <StatCard label="Avg Response" value={`${avgResponse}ms`} icon={<Clock className="w-5 h-5 text-purple-500" />} bg="bg-purple-50" />
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={() => setShowTestPanel(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${showTestPanel ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <Play className="w-4 h-4" /> {showTestPanel ? 'Hide Test Panel' : 'Test Order API'}
        </button>
        <button
          onClick={() => fetchApiLogs()}
          disabled={loadingApiLogs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          {loadingApiLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Logs
        </button>
        <button
          onClick={() => setConfirmCleanup(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Cleanup Old Logs
        </button>
      </div>

      {showTestPanel && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Test Order Endpoint</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Partner API Key *</label>
                <input
                  value={partnerKey}
                  onChange={e => setPartnerKey(e.target.value)}
                  placeholder="cmm_pk_..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-red-500"
                />
                <p className="mt-1 text-xs text-gray-500">Required. Requests are authenticated with the `X-Partner-Key` header.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Request Payload (JSON)</label>
                <textarea
                  value={testPayload}
                  onChange={e => setTestPayload(e.target.value)}
                  rows={14}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 font-mono focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
              <button
                onClick={handleTestOrder}
                disabled={testLoading || !partnerKey.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {testLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Play className="w-4 h-4" /> Send Request</>}
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Response</label>
              <div className={`h-full min-h-[200px] rounded-xl border p-4 font-mono text-sm overflow-auto ${testResult ? testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {testResult ? (
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(testResult, null, 2)}</pre>
                ) : (
                  <p className="text-sm">Response will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Request Logs</h3>
          <span className="text-xs text-gray-500">{apiLogs.length} entries</span>
        </div>

        {loadingApiLogs ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-red-500 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading logs...</p>
          </div>
        ) : apiLogs.length === 0 ? (
          <div className="py-12 text-center">
            <Globe className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No API logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {apiLogs.map(log => (
              <div key={log.id}>
                <div
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  {log.success
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{log.statusCode}</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">{log.endpoint}</span>
                      {log.orderNumber && <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">#{log.orderNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        {log.sourceIp}
                        {/* Explicit === true / === false: null means "unknown",
                            which must not render as "not recognised". */}
                        {log.ipWhitelisted === true && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wide"
                            title="Source IP matched an active whitelist entry"
                          >
                            Known
                          </span>
                        )}
                        {log.ipWhitelisted === false && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide"
                            title="Source IP is not in the whitelist. The request was still accepted — nothing is blocked."
                          >
                            Unlisted
                          </span>
                        )}
                      </span>
                      {log.partnerName && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-gray-600">{log.partnerName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{log.responseTime}ms</span>
                      <span>·</span>
                      <span>{new Date(log.timestamp).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                  {expandedLog === log.id ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>
                {expandedLog === log.id && (
                  <div className="px-5 pb-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Request Payload</p>
                        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                          {(() => { try { return JSON.stringify(JSON.parse(log.payload), null, 2); } catch { return log.payload; } })()}
                        </pre>
                      </div>
                      {!log.success && log.error && (
                        <div>
                          <p className="text-xs font-bold text-red-500 mb-1 uppercase tracking-wider">Error</p>
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-mono">{log.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmCleanup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Clean Up Old Logs?</h3>
            <p className="text-sm text-gray-600 text-center mb-5">This will delete all API logs older than 90 days.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCleanup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCleanup} disabled={cleaningUp} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                {cleaningUp ? 'Cleaning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, icon, bg }: { label: string; value: string | number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
