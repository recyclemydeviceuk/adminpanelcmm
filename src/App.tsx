import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './AdminContext';
import AdminGuard from './AdminGuard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminOrderDetail from './pages/AdminOrderDetail';
import AdminDevices from './pages/AdminDevices';
import AdminDeviceForm from './pages/AdminDeviceForm';
import AdminPricing from './pages/AdminPricing';
import AdminUtilities from './pages/AdminUtilities';
import AdminApiGateway from './pages/AdminApiGateway';
import AdminPartners from './pages/AdminPartners';

const BASE = '/admin-cashmymobile';

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <Routes>
          <Route path={`${BASE}/login`} element={<AdminLogin />} />
          <Route
            path={BASE}
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/orders`}
            element={
              <AdminGuard>
                <AdminOrders />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/orders/:id`}
            element={
              <AdminGuard>
                <AdminOrderDetail />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/devices`}
            element={
              <AdminGuard>
                <AdminDevices />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/devices/new`}
            element={
              <AdminGuard>
                <AdminDeviceForm />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/devices/edit/:id`}
            element={
              <AdminGuard>
                <AdminDeviceForm />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/pricing`}
            element={
              <AdminGuard>
                <AdminPricing />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/utilities`}
            element={
              <AdminGuard>
                <AdminUtilities />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/api-gateway`}
            element={
              <AdminGuard>
                <AdminApiGateway />
              </AdminGuard>
            }
          />
          <Route
            path={`${BASE}/partners`}
            element={
              <AdminGuard>
                <AdminPartners />
              </AdminGuard>
            }
          />
          <Route path="/" element={<Navigate to={BASE} replace />} />
          <Route path="*" element={<Navigate to={BASE} replace />} />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  );
}
