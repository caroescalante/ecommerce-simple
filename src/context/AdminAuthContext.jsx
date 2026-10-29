import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../services/adminApi';

const Ctx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al abrir el portal se consulta si ya hay una sesión válida
  useEffect(() => {
    let off = false;
    adminApi.me()
      .then((r) => !off && setUser(r.user))
      .catch(() => {})
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await adminApi.login(email, password);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try { await adminApi.logout(); } finally { setUser(null); }
  }, []);

  // Si la sesión venció (401) en cualquier pantalla, se vuelve al login; si no, se muestra el error
  const handleError = useCallback((err, setError) => {
    if (err.status === 401) setUser(null);
    else setError(err.message);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, handleError }), [user, loading, login, logout, handleError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de <AdminAuthProvider>');
  return ctx;
}
