import { useEffect } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';
import logo from '../../assets/logo.png';
import Login from './Login';
import Products from './Products';
import ProductForm from './ProductForm';
import './Admin.css';

function RequireAdmin() {
  const { user, loading } = useAdminAuth();
  const location = useLocation();
  if (loading) return <p className="adm__loading">Cargando…</p>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Shell />;
}

function Shell() {
  const { user, logout } = useAdminAuth();
  return (
    <div className="adm">
      <header className="adm__bar">
        <Link to="/admin" className="adm__brand">
          <img src={logo} alt="" width="36" height="36" />
          <strong>Dismarco</strong>
          <span>Admin</span>
        </Link>
        <div className="adm__right">
          <a className="adm__link" href="/">Ver tienda</a>
          <span className="adm__user">{user.nombre}</span>
          <button className="adm__btn" onClick={logout}>Salir</button>
        </div>
      </header>
      <main className="adm__main"><Outlet /></main>
    </div>
  );
}

export default function AdminApp() {
  // El portal no debe aparecer en buscadores
  useEffect(() => {
    const prev = document.title;
    document.title = 'Admin | Dismarco';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.title = prev; meta.remove(); };
  }, []);

  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<Products />} />
          <Route path="/admin/productos/nuevo" element={<ProductForm />} />
          <Route path="/admin/productos/:id" element={<ProductForm />} />
        </Route>
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
