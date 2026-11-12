import {lazy, Suspense} from 'react';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';

import {useAuth} from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import Loading from './components/Loading.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const Channels = lazy(() => import('./pages/Channels.jsx'));
const Agent = lazy(() => import('./pages/Agent.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Loyalty = lazy(() => import('./pages/Loyalty.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Verification = lazy(() => import('./pages/Verification.jsx'));
const Billing = lazy(() => import('./pages/Billing.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function RequireAuth({children}) {
  const {isAuthenticated} = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{from: location}} />;
  return children;
}

function GuestOnly({children}) {
  const {isAuthenticated} = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="channels" element={<Channels />} />
          <Route path="agent" element={<Agent />} />
          <Route path="customers" element={<Customers />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="verification" element={<Verification />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
