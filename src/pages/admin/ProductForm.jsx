import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Thumb } from './Products';

const MAX_IMAGE = 3 * 1024 * 1024;
const MAX_OPTIONS = 30;
const MAX_OPTION_LENGTH = 60;

// Suma opciones a la lista (se pueden pegar varias separadas por coma). Ignora vacías y repetidas.
function mergeOptions(list, text) {
  const seen = new Set(list.map((o) => o.toLowerCase()));
  const fresh = [];
  for (const raw of text.split(',')) {
    const o = raw.trim().slice(0, MAX_OPTION_LENGTH);
    if (o && !seen.has(o.toLowerCase())) { seen.add(o.toLowerCase()); fresh.push(o); }
  }
  return [...list, ...fresh].slice(0, MAX_OPTIONS);
}

// Acepta 1500, 1500.5 o 1.500,50. Devuelve un número o null si no es válido.
function parsePrice(text) {
  let t = String(text).trim().replace(/\s/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : null;
}

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { handleError } = useAdminAuth();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ descripcion: '', precio: '', categoriaId: '', imagenUrl: null, imagenSrc: null, enumSiNo: false, enumDetalle: [] });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    const jobs = [adminApi.categories().then((c) => !off && setCategories(c))];
    if (editing) {
      jobs.push(adminApi.product(id).then((p) => !off && setForm({
        descripcion: p.descripcion,
        precio: String(p.precio).replace('.', ','),
        categoriaId: String(p.categoriaId),
        imagenUrl: p.imagenUrl,
        imagenSrc: p.imagenSrc,
        enumSiNo: p.enumSiNo,
        enumDetalle: p.enumDetalle ?? [],
      })));
    }
    Promise.all(jobs).catch((e) => !off && handleError(e, setError)).finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [id, editing, handleError]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addDraft = () => {
    setForm((f) => ({ ...f, enumDetalle: mergeOptions(f.enumDetalle, draft) }));
    setDraft('');
  };
  const removeOption = (i) => setForm((f) => ({ ...f, enumDetalle: f.enumDetalle.filter((_, n) => n !== i) }));

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Usá una imagen JPG, PNG o WebP');
    if (file.size > MAX_IMAGE) return setError('La imagen supera los 3 MB');
    setUploading(true);
    try {
      const r = await adminApi.upload(file);
      setForm((f) => ({ ...f, imagenUrl: r.url, imagenSrc: r.src }));
    } catch (err) {
      handleError(err, setError);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const precio = parsePrice(form.precio);
    const next = {};
    if (form.descripcion.trim().length < 2) next.descripcion = 'Escribí una descripción';
    if (precio === null) next.precio = 'Ingresá un precio válido, por ejemplo 1500 o 1500,50';
    if (!form.categoriaId) next.categoriaId = 'Elegí una categoría';
    // Lo que quedó escrito sin agregar cuenta como una opción más
    const enumDetalle = form.enumSiNo ? mergeOptions(form.enumDetalle, draft) : [];
    if (form.enumSiNo && !enumDetalle.length) next.enumDetalle = 'Agregá al menos una opción';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    const body = { descripcion: form.descripcion.trim(), precio, categoriaId: Number(form.categoriaId), imagenUrl: form.imagenUrl, enumSiNo: form.enumSiNo, enumDetalle };
    try {
      if (editing) await adminApi.updateProduct(id, body);
      else await adminApi.createProduct(body);
      navigate('/admin', { state: { flash: editing ? 'Cambios guardados' : 'Producto creado' } });
    } catch (err) {
      handleError(err, setError);
      setSaving(false);
    }
  };

  if (loading) return <p className="adm__loading">Cargando…</p>;

  return (
    <>
      <div className="adm__head">
        <h1>{editing ? 'Editar producto' : 'Nuevo producto'}</h1>
        <Link className="adm__btn" to="/admin">Volver</Link>
      </div>

      <form className="adm__form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Descripción</span>
          <input value={form.descripcion} onChange={set('descripcion')} maxLength={1000} aria-invalid={Boolean(errors.descripcion)} autoFocus={!editing} />
          {errors.descripcion && <em role="alert">{errors.descripcion}</em>}
        </label>

        <div className="adm__row">
          <label className="field">
            <span>Precio ($)</span>
            <input inputMode="decimal" value={form.precio} onChange={set('precio')} placeholder="1500,00" aria-invalid={Boolean(errors.precio)} />
            {errors.precio && <em role="alert">{errors.precio}</em>}
          </label>
          <label className="field">
            <span>Categoría</span>
            <select value={form.categoriaId} onChange={set('categoriaId')} aria-invalid={Boolean(errors.categoriaId)}>
              <option value="">Elegí una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoriaId && <em role="alert">{errors.categoriaId}</em>}
          </label>
        </div>

        <label className="field">
          <span>¿Tiene opciones? (sabores, variedades…)</span>
          <select value={form.enumSiNo ? 'si' : 'no'} onChange={(e) => setForm((f) => ({ ...f, enumSiNo: e.target.value === 'si' }))}>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </label>

        {form.enumSiNo && (
          <div className="field">
            <span>Opciones</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraft(); } }}
                placeholder="Ej. Manzana (podés pegar varias separadas por coma)"
                maxLength={500}
                aria-invalid={Boolean(errors.enumDetalle)}
                style={{ flex: 1 }}
              />
              <button type="button" className="adm__btn" onClick={addDraft} disabled={!draft.trim()}>Agregar</button>
            </div>
            {errors.enumDetalle && <em role="alert">{errors.enumDetalle}</em>}
            {form.enumDetalle.length > 0 && (
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                {form.enumDetalle.map((o, i) => (
                  <li key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 12px', border: '1px solid currentColor', borderRadius: 999 }}>
                    {o}
                    <button type="button" className="adm__btn" onClick={() => removeOption(i)} aria-label={`Quitar ${o}`}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="field">
          <span>Imagen</span>
          <div className="adm__image">
            <Thumb src={form.imagenSrc} />
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} hidden />
              <button type="button" className="adm__btn" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? 'Subiendo…' : form.imagenUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imagenUrl && !uploading && (
                <button type="button" className="adm__btn adm__btn--danger" onClick={() => setForm((f) => ({ ...f, imagenUrl: null, imagenSrc: null }))}>Quitar</button>
              )}
              <small>JPG, PNG o WebP, hasta 3 MB. Mejor si es cuadrada.</small>
            </div>
          </div>
        </div>

        {error && <p className="adm__error" role="alert">{error}</p>}

        <div className="adm__actions">
          <Link className="adm__btn" to="/admin">Cancelar</Link>
          <button className="btn btn--accent" disabled={saving || uploading}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </>
  );
}