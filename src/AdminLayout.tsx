import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Smartphone, BarChart2,
  Globe, Settings, LogOut, Menu, X, ChevronRight,
  ExternalLink, Building2, Rss,
} from 'lucide-react';
import { adminAuthApi } from './api/adminAuth';

const BASE = '/admin-cashmymobile';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: BASE },
  { label: 'Orders', icon: Package, to: `${BASE}/orders` },
  { label: 'Devices', icon: Smartphone, to: `${BASE}/devices` },
  { label: 'Pricing', icon: BarChart2, to: `${BASE}/pricing` },
  { label: 'Feed', icon: Rss, to: `${BASE}/feed` },
  { label: 'Utilities', icon: Settings, to: `${BASE}/utilities` },
  { label: 'API Gateway', icon: Globe, to: `${BASE}/api-gateway` },
  { label: 'Partners', icon: Building2, to: `${BASE}/partners` },
];

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('Admin');

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setAdminEmail(user.email || 'Admin');
      } catch (e) {
        setAdminEmail('Admin');
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
    } finally {
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminUser');
      navigate('/admin-cashmymobile/login');
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 z-40 flex flex-col
        bg-white border-r border-gray-200 shadow-sm
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto
      `}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <Link to="/" className="flex items-center gap-3 group" target="_blank">
            <img
              src="https://res.cloudinary.com/dn2sab6qc/image/upload/v1772457689/CMM-Logo_kid8km.png"
              alt="Cash My Mobile"
              className="h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(4392%) hue-rotate(354deg) brightness(92%) contrast(93%)' }}
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-4 mb-5">
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/40">
              <span className="text-white text-[10px] font-black">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-tight truncate">Admin Panel</p>
              <p className="text-[10px] text-gray-600 leading-tight truncate" title={adminEmail}>{adminEmail}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className="w-2 h-2 bg-emerald-400 rounded-full block shadow-sm shadow-emerald-400/60" />
            </div>
          </div>
        </div>

        <div className="px-3 mb-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2">Navigation</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const active = to === BASE
              ? location.pathname === BASE || location.pathname === BASE + '/'
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-200'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                `}
              >
                {!active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-red-500 rounded-r-full transition-all duration-200 group-hover:h-5 opacity-0 group-hover:opacity-100" />
                )}
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mx-3 mb-3 h-px bg-gray-200" />
          <div className="px-3 pb-5 space-y-0.5">
            <a
              href="https://www.cashmymobile.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all group"
            >
              <ExternalLink className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1">View Website</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all group"
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4 flex-shrink-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-red-50 border border-red-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-900/40">
                A
              </div>
              <span className="text-xs font-medium text-gray-700 pr-2 max-w-[150px] truncate" title={adminEmail}>{adminEmail.split('@')[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
          {subtitle && (
            <p className="text-sm text-gray-600 -mt-2 mb-4 font-medium">{subtitle}</p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
