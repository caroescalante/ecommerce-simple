import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { formatPrice } from '../../utils/format';

export function Thumb({ src }) {
  if (src) return <img className="thumb" src={src} alt="" loading="lazy" />;
  return (
    <div className="thumb thumb--empty" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M10 2h4v3l1.2 3.2c.5 1.2.8 2.2.8 3.4V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9.4c0-1.2.3-2.2.8-3.4L10 5V2z" /></svg>
    </div>
  );
}

export default function Products() {
  const { handleError } = useAdminAuth();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash || '');
  const [reload, setReload] = useState(0);

  useEffect(() => { window.history.replaceState({}, ''); }, []); // el aviso no reaparece al recargar
  useEffect(() => { adminApi.categories().then(setCategories).catch(() => {}); }, []);

  // Espera 300 ms después de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let off = false;
    setLoading(true);
    setError('');
    adminApi.products({ q: search, categoriaId, page })
      .then((r) => !off && setData(r))
      .catch((e) => !off && handleError(e, setError))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [search, categoriaId, page, reload, handleError]);

  const remove = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.descripcion}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      setFlash('Producto eliminado');
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else setReload((n) => n + 1);
    } catch (e) {
      handleError(e, setError);
    }
  };

  const { items, total, pageSize } = data;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <div className="adm__head">
        <h1>Productos</h1>
        <Link className="btn btn--accent adm__new" to="/admin/productos/nuevo">+ Nuevo producto</Link>
      </div>

      {flash && <p className="adm__flash" role="status">{flash}</p>}

      <div className="adm__filters">
        <label className="field">
          <span className="sr-only">Buscar</span>
          <input type="search" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="field">
          <span className="sr-only">Categoría</span>
          <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="adm__error" role="alert">{error}</p>}

      <ul className="alist" aria-busy={loading}>
        {items.map((p) => (
          <li key={p.id} className="arow">
            <Thumb src={p.imagenSrc} />
            <div className="arow__info">
              <strong>{p.descripcion}</strong>
              <small>{p.categoria}</small>
            </div>
            <span className="arow__price">{formatPrice(p.precio)}</span>
            <div className="arow__actions">
              <Link className="adm__btn" to={`/admin/productos/${p.id}`}>Editar</Link>
              <button className="adm__btn adm__btn--danger" onClick={() => remove(p)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && !items.length && !error && <p className="adm__empty">No hay productos para mostrar.</p>}
      {loading && <p className="adm__loading">Cargando…</p>}

      {total > 0 && (
        <nav className="adm__pager" aria-label="Paginación">
          <button className="adm__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>{from}–{to} de {total}</span>
          <button className="adm__btn" disabled={to >= total} onClick={() => setPage(page + 1)}>Siguiente</button>
        </nav>
      )}
    </>
  );
}
