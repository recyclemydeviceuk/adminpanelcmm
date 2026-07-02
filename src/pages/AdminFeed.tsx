import { useState, useEffect } from 'react';
import { Copy, ExternalLink, RefreshCw, Download, Eye } from 'lucide-react';

interface FeedLog {
  id: string;
  endpoint: string;
  source_ip: string;
  user_agent: string | null;
  partner_name: string | null;
  rows_returned: number;
  query_params: string | null;
  response_time_ms: number;
  created_at: string;
}

interface FeedStats {
  total_accesses: number;
  endpoint_stats: Array<{
    _id: string;
    count: number;
    total_rows: number;
    avg_response_time: number;
  }>;
  recent_accesses: Array<{
    endpoint: string;
    source_ip: string;
    rows_returned: number;
    created_at: string;
  }>;
}

export default function AdminFeed() {
  const [logs, setLogs] = useState<FeedLog[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const ORIGIN = API_BASE.replace(/\/api$/, '');
  const FEED_URL_CSV = `${ORIGIN}/api/feed/pricing`;
  const FEED_URL_JSON = `${ORIGIN}/api/feed/pricing/json`;
  const API = ORIGIN;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page]);

  const redirectIfUnauthorized = (res: Response) => {
    if (res.status === 401) {
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminUser');
      window.location.replace('/admin-cashmymobile/login');
      return true;
    }
    return false;
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      const res = await fetch(`${API}/api/feed-logs?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (redirectIfUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      const res = await fetch(`${API}/api/feed-logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (redirectIfUnauthorized(res)) return;
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pricing Feed</h1>
          <p className="text-gray-600 mt-2">Live pricing data feed for partners and integrations</p>
        </div>

        {/* Feed URLs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* CSV Feed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">CSV Feed URL</h2>
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <code className="text-sm text-gray-700 break-all">{FEED_URL_CSV}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(FEED_URL_CSV)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={() => openInNewTab(FEED_URL_CSV)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">Query Parameters:</p>
              <ul className="space-y-1">
                <li>• <code>?brand=apple</code> - Filter by brand</li>
                <li>• <code>?active_only=false</code> - Include inactive devices</li>
                <li>• <code>?category=Phone</code> - Filter by category</li>
              </ul>
            </div>
          </div>

          {/* JSON Feed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">JSON Feed URL</h2>
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <code className="text-sm text-gray-700 break-all">{FEED_URL_JSON}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(FEED_URL_JSON)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={() => openInNewTab(FEED_URL_JSON)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">Response Format:</p>
              <ul className="space-y-1">
                <li>• JSON array with device pricing data</li>
                <li>• Same filters as CSV feed</li>
                <li>• Includes metadata and timestamp</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Accesses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_accesses}</p>
                </div>
                <Eye className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {stats.endpoint_stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat._id}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.count} calls</p>
                    <p className="text-xs text-gray-500 mt-1">Avg: {Math.round(stat.avg_response_time)}ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed Access Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Feed Access Logs</h2>
            <button
              onClick={() => {
                setLoading(true);
                fetchLogs();
                fetchStats();
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading logs...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rows
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Query Params
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.endpoint}</code>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {log.source_ip}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {log.rows_returned}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {log.response_time_ms}ms
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.query_params || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
