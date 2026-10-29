import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import StoreHero from './components/StoreHero/StoreHero';
import CartDrawer from './components/CartDrawer/CartDrawer';
import Category from './pages/Category';
import Search from './pages/Search';
import Checkout from './pages/Checkout';

// El portal Admin se carga aparte: los clientes de la tienda no descargan su código
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

export default function App() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return <Suspense fallback={<p style={{ padding: 24 }}>Cargando…</p>}><AdminApp /></Suspense>;
  }
  return (
    <>
      <Header />
      {!pathname.startsWith('/pedido') && <StoreHero />}
      <Routes>
        <Route path="/" element={<Navigate to="/categoria/promociones" replace />} />
        <Route path="/categoria/:slug" element={<Category />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/pedido" element={<Checkout />} />
        <Route path="*" element={<main className="page"><h2>Próximamente</h2></main>} />
      </Routes>
      <CartDrawer />
    </>
  );
}
