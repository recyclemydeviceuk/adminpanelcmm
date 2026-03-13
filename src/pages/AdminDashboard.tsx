import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Smartphone, TrendingUp, CheckCircle2,
  ArrowRight, Globe, XCircle,
} from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { useAdmin } from '../AdminContext';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../types';
import { dashboardApi, type DashboardStats, type RecentOrder, type StatusBreakdown } from '../api/dashboard';

export default function AdminDashboard() {
  const { orders, devices, apiLogs } = useAdmin();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentOrdersData, setRecentOrdersData] = useState<RecentOrder[]>([]);
  const [statusBreakdownData, setStatusBreakdownData] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, recentRes, breakdownRes] = await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getRecentOrders(6),
          dashboardApi.getStatusBreakdown(),
        ]);
        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value;
          // python_backend wraps in { success, data: { stats: {...} } }
          const stats = (s as any)?.data?.stats || (s as any)?.stats || s?.data;
          if (stats) setDashboardStats(stats);
        }
        if (recentRes.status === 'fulfilled') {
          const r = recentRes.value;
          const orders = (r as any)?.data?.orders || (r as any)?.orders || [];
          if (orders.length >= 0) setRecentOrdersData(orders);
        }
        if (breakdownRes.status === 'fulfilled') {
          const b = breakdownRes.value;
          const breakdown = (b as any)?.data?.breakdown || (b as any)?.breakdown || [];
          if (breakdown.length >= 0) setStatusBreakdownData(breakdown);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (!dashboardStats) {
      const total = orders.length;
      const active = orders.filter(o => !['COMPLETED', 'PAID', 'CLOSED', 'CANCELLED'].includes(o.status)).length;
      const paidCompleted = orders.filter(o => ['COMPLETED', 'PAID'].includes(o.status)).length;
      const totalValue = orders.filter(o => ['COMPLETED', 'PAID'].includes(o.status)).reduce((s, o) => s + (o.finalPrice || o.offeredPrice), 0);
      const apiOrders = orders.filter(o => o.source === 'API').length;
      const apiErrors = apiLogs.filter(l => !l.success).length;
      const devicesActive = devices.filter(d => d.isActive).length;
      return { total, active, paid: paidCompleted, totalValue, apiOrders, apiErrors, devicesActive };
    }
    return {
      total: dashboardStats.orders.total,
      active: dashboardStats.orders.pending,
      paid: orders.filter(o => ['COMPLETED', 'PAID'].includes(o.status)).length,
      totalValue: dashboardStats.revenue.total,
      apiOrders: orders.filter(o => o.source === 'API').length,
      apiErrors: apiLogs.filter(l => !l.success).length,
      devicesActive: dashboardStats.devices.active,
    };
  }, [dashboardStats, orders, devices, apiLogs]);

  const recentOrders = recentOrdersData.length > 0
    ? recentOrdersData.map(o => ({
        id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        source: o.source,
        customerName: o.customerName,
        deviceName: o.deviceName,
        offeredPrice: o.offeredPrice,
        finalPrice: o.finalPrice,
        createdAt: o.createdAt,
      }))
    : orders.slice(0, 6);

  const localStatusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const statusBreakdown = statusBreakdownData.length > 0
    ? statusBreakdownData.map(item => [item.status, item.count] as [string, number])
    : localStatusBreakdown;

  const recentLogs = apiLogs.slice(0, 5);

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your operations">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Package className="w-5 h-5 text-blue-400" />} bg="bg-blue-500/10" label="Total Orders" value={stats.total} sub={`${stats.active} active`} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} bg="bg-emerald-500/10" label="Paid Out" value={stats.paid} sub={`£${stats.totalValue.toLocaleString()}`} />
        <StatCard icon={<Globe className="w-5 h-5 text-purple-400" />} bg="bg-purple-500/10" label="API Orders" value={stats.apiOrders} sub={`${stats.apiErrors} errors`} />
        <StatCard icon={<Smartphone className="w-5 h-5 text-orange-400" />} bg="bg-orange-500/10" label="Active Devices" value={stats.devicesActive} sub={`${devices.length} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin-cashmymobile/orders" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map(o => (
              <Link key={o.id} to={`/admin-cashmymobile/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">#{o.orderNumber}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[o.status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-700'}`}>
                      {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] || o.status}
                    </span>
                    {o.source === 'API' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">API</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{o.customerName} · {o.deviceName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">£{(o.finalPrice || o.offeredPrice).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{new Date(o.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Status Breakdown</h2>
            </div>
            <div className="px-5 py-3 space-y-2.5">
              {statusBreakdown.map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-700 text-gray-300'}`}>
                    {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${orders.length ? (count / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-2">
              <QuickAction to="/admin-cashmymobile/orders" icon={<Package className="w-4 h-4" />} label="Manage Orders" color="text-blue-600 bg-blue-50" />
              <QuickAction to="/admin-cashmymobile/devices" icon={<Smartphone className="w-4 h-4" />} label="Manage Devices" color="text-orange-600 bg-orange-50" />
              <QuickAction to="/admin-cashmymobile/pricing" icon={<TrendingUp className="w-4 h-4" />} label="Update Pricing" color="text-emerald-600 bg-emerald-50" />
              <QuickAction to="/admin-cashmymobile/api-gateway" icon={<Globe className="w-4 h-4" />} label="API Gateway" color="text-purple-600 bg-purple-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">API Logs</h2>
              <Link to="/admin-cashmymobile/api-gateway" className="text-xs font-semibold text-red-600 hover:text-red-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                  {log.success
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {log.success ? log.orderNumber || 'Success' : log.error || 'Failed'}
                    </p>
                    <p className="text-[10px] text-gray-600">{log.sourceIp} · {log.responseTime}ms</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {log.statusCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickAction({ to, icon, label, color }: { to: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
    </Link>
  );
}
